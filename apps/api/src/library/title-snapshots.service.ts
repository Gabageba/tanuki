import { Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, inArray, notExists, sql } from 'drizzle-orm';
import { normalizeChapter, titleIdOf } from '../common/normalize';
import { DatabaseService } from '../database/database.service';
import {
  bookmarks,
  readingProgress,
  titleChapterSnapshots,
  titleChaptersSeen,
  USER_TITLE_SNAPSHOT_FALLBACKS,
} from '../database/schema';
import { linkKeyOf, parseLinkKey } from '../matches/title-links.service';
import type { RawTitle } from '../parsers-client/parsers-client.types';
import type { CachedResult } from '../parsers-client/parsers-client.service';
import { countSnapshotChapters, toSnapshotBranchId } from './bookmark-groups';
import type { Transaction } from './library-merge.service';
import {
  SNAPSHOT_INSERT_CHUNK,
  SNAPSHOT_REFRESH_MIN_INTERVAL_MS,
  TITLE_SNAPSHOT_ORIGIN,
  type TitleMetadata,
  type TitleSnapshotOrigin,
} from './models';
import {
  getSnapshotMetadataUpdate,
  lockSnapshotKeys,
  lockSnapshotLifecycle,
  lockTitleSnapshot,
  normalizeSnapshotRating,
  snapshotOriginPriority,
} from './title-snapshot-storage';

type RecordOptions = Pick<CachedResult<RawTitle>, 'stale' | 'fetchedAt'> & {
  force?: boolean;
  tx?: Transaction;
};

/** Общие метаданные и независимый журнал бесплатных глав. Файлы сюда не пишут. */
@Injectable()
export class TitleSnapshotsService {
  private readonly logger = new Logger(TitleSnapshotsService.name);

  constructor(private readonly database: DatabaseService) {}

  async record(
    sourceId: string,
    url: string,
    raw: RawTitle,
    options: Partial<RecordOptions> = {},
  ): Promise<void> {
    if (options.stale) return;
    const operation = async (tx: Transaction) => {
      await lockSnapshotLifecycle(tx);
      const titleKey = linkKeyOf(sourceId, url);
      await lockTitleSnapshot(tx, titleKey);
      const fetchedAt = new Date(options.fetchedAt ?? Date.now());
      await this.writeMetadata(
        tx,
        [
          {
            titleKey,
            sourceId,
            titleId: titleIdOf(sourceId, raw),
            name: raw.title,
            coverUrl: raw.coverUrl,
            contentRating: raw.contentRating,
            type: raw.type ?? null,
          },
        ],
        TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS,
        fetchedAt,
      );
      if (!raw.chapters) return;
      const [existing] = await tx
        .select()
        .from(titleChapterSnapshots)
        .where(eq(titleChapterSnapshots.titleKey, titleKey))
        .limit(1);
      // Одинаковый cache hit не делает проверку новее. Метаданные обновлены независимо от throttle.
      if (
        existing?.checkedAt &&
        (fetchedAt <= existing.checkedAt ||
          (!options.force &&
            fetchedAt.getTime() - existing.checkedAt.getTime() < SNAPSHOT_REFRESH_MIN_INTERVAL_MS))
      )
        return;
      const baseline = !existing?.chaptersInitialized;
      await tx
        .update(titleChapterSnapshots)
        .set({
          chaptersInitialized: true,
          checkedAt: fetchedAt,
          lastError: null,
          missing: false,
          chaptersCount: countSnapshotChapters(raw),
        })
        .where(eq(titleChapterSnapshots.titleKey, titleKey));
      const chapters = raw.chapters.filter((chapter) => !chapter.isPaid);
      for (let start = 0; start < chapters.length; start += SNAPSHOT_INSERT_CHUNK) {
        await tx
          .insert(titleChaptersSeen)
          .values(
            chapters.slice(start, start + SNAPSHOT_INSERT_CHUNK).map((chapter) => ({
              titleKey,
              chapterId: normalizeChapter(sourceId, '', chapter).id,
              branchId: toSnapshotBranchId(chapter.branch),
              chapterVolume: chapter.volume,
              chapterNumber: chapter.number,
              baseline,
            })),
          )
          .onConflictDoNothing();
      }
    };
    if (options.tx) await operation(options.tx);
    else await this.database.db.transaction(operation);
  }

  /** Список закладок сайта может только создать начальные метаданные, не заменить детали. */
  async recordSourceBookmarks(
    tx: Transaction,
    rows: (TitleMetadata & { titleKey: string; sourceId: string })[],
    fetchedAt: Date,
  ) {
    await lockSnapshotLifecycle(tx);
    const unique = new Map(rows.map((row) => [row.titleKey, row]));
    await lockSnapshotKeys(tx, [...unique.keys()]);
    const values = [...unique.values()];
    for (let start = 0; start < values.length; start += SNAPSHOT_INSERT_CHUNK) {
      await this.writeMetadata(
        tx,
        values.slice(start, start + SNAPSHOT_INSERT_CHUNK),
        TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK,
        fetchedAt,
      );
    }
  }

  private async writeMetadata(
    tx: Transaction,
    rows: (TitleMetadata & { titleKey: string; sourceId: string })[],
    origin: TitleSnapshotOrigin,
    fetchedAt: Date,
  ) {
    const values = rows
      .filter((row) => row.titleId && row.name)
      .map((row) => ({
        titleKey: row.titleKey,
        sourceId: row.sourceId,
        titleId: row.titleId!,
        name: row.name,
        coverUrl: row.coverUrl,
        contentRating: normalizeSnapshotRating(row.sourceId, row.contentRating),
        type: row.type,
        metadataOrigin: origin,
        metadataFetchedAt: fetchedAt,
      }));
    if (values.length === 0) return;
    await tx
      .insert(titleChapterSnapshots)
      .values(values)
      .onConflictDoUpdate({
        target: titleChapterSnapshots.titleKey,
        set: {
          titleId: sql`excluded.title_id`,
          name: sql`excluded.name`,
          metadataOrigin: sql`excluded.metadata_origin`,
          metadataFetchedAt: sql`excluded.metadata_fetched_at`,
          // Неизвестный рейтинг не снимает известный ADULT; отсутствие обложки в деталях известно.
          ...getSnapshotMetadataUpdate(origin),
        },
        setWhere: sql`${titleChapterSnapshots.metadataOrigin} IS NULL OR
        (CASE ${titleChapterSnapshots.metadataOrigin}
          WHEN ${TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS} THEN ${snapshotOriginPriority(TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS)}
          WHEN ${TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK} THEN ${snapshotOriginPriority(TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK)} END < ${snapshotOriginPriority(origin)}) OR
        (${titleChapterSnapshots.metadataOrigin} = excluded.metadata_origin AND
          (${titleChapterSnapshots.metadataFetchedAt} IS NULL OR ${titleChapterSnapshots.metadataFetchedAt} < excluded.metadata_fetched_at))`,
      });
    await tx.delete(USER_TITLE_SNAPSHOT_FALLBACKS).where(
      inArray(
        USER_TITLE_SNAPSHOT_FALLBACKS.titleKey,
        values.map(({ titleKey }) => titleKey),
      ),
    );
  }

  recordQuietly(
    sourceId: string,
    url: string,
    raw: RawTitle,
    options: Partial<RecordOptions> = {},
  ): void {
    this.record(sourceId, url, raw, options).catch((error: unknown) => {
      this.logger.warn(`Снимок ${sourceId} не записан: ${(error as Error).message}`);
    });
  }

  async markFailed(titleKey: string, error: string, missing: boolean): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      await lockSnapshotLifecycle(tx);
      await lockTitleSnapshot(tx, titleKey);
      const values = { checkedAt: new Date(), lastError: error, missing };
      if (!missing) {
        await tx
          .update(titleChapterSnapshots)
          .set(values)
          .where(eq(titleChapterSnapshots.titleKey, titleKey));
        return;
      }
      const [bookmark] = await tx
        .select({ userId: bookmarks.userId })
        .from(bookmarks)
        .where(eq(bookmarks.titleKey, titleKey))
        .limit(1);
      const [progress] = bookmark
        ? []
        : await tx
            .select({ userId: readingProgress.userId })
            .from(readingProgress)
            .where(eq(readingProgress.titleKey, titleKey))
            .limit(1);
      const owner = bookmark ?? progress;
      const [fallback] = owner
        ? await tx
            .select()
            .from(USER_TITLE_SNAPSHOT_FALLBACKS)
            .where(
              and(
                eq(USER_TITLE_SNAPSHOT_FALLBACKS.userId, owner.userId),
                eq(USER_TITLE_SNAPSHOT_FALLBACKS.titleKey, titleKey),
              ),
            )
            .limit(1)
        : [];
      const [existing] = await tx
        .select()
        .from(titleChapterSnapshots)
        .where(eq(titleChapterSnapshots.titleKey, titleKey))
        .limit(1);
      const titleId = existing?.titleId ?? fallback?.titleId;
      if (!titleId) return;
      await tx
        .insert(titleChapterSnapshots)
        .values({ titleKey, sourceId: parseLinkKey(titleKey).sourceId, titleId, ...values })
        .onConflictDoUpdate({ target: titleChapterSnapshots.titleKey, set: values });
    });
  }

  async listNewChapterIds(titleKey: string, since: Date): Promise<string[]> {
    const rows = await this.database.db
      .select({ chapterId: titleChaptersSeen.chapterId })
      .from(titleChaptersSeen)
      .where(
        and(
          eq(titleChaptersSeen.titleKey, titleKey),
          eq(titleChaptersSeen.baseline, false),
          gt(titleChaptersSeen.firstSeenAt, since),
        ),
      );
    return rows.map(({ chapterId }) => chapterId);
  }

  async deleteOrphans(): Promise<number> {
    return this.database.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended('title-snapshot-lifecycle', 0))`,
      );
      await tx.execute(sql`DELETE FROM ${USER_TITLE_SNAPSHOT_FALLBACKS} f WHERE
        EXISTS (SELECT 1 FROM ${titleChapterSnapshots} s WHERE s.title_key = f.title_key AND s.metadata_origin IS NOT NULL AND s.name IS NOT NULL)
        OR (NOT EXISTS (SELECT 1 FROM ${bookmarks} b WHERE b.user_id = f.user_id AND b.title_key = f.title_key)
          AND NOT EXISTS (SELECT 1 FROM ${readingProgress} p WHERE p.user_id = f.user_id AND p.title_key = f.title_key))`);
      const deleted = await tx
        .delete(titleChapterSnapshots)
        .where(
          and(
            notExists(
              tx
                .select({ one: sql`1` })
                .from(bookmarks)
                .where(eq(bookmarks.titleKey, titleChapterSnapshots.titleKey)),
            ),
            notExists(
              tx
                .select({ one: sql`1` })
                .from(readingProgress)
                .where(eq(readingProgress.titleKey, titleChapterSnapshots.titleKey)),
            ),
          ),
        )
        .returning({ titleKey: titleChapterSnapshots.titleKey });
      await tx.execute(sql`DELETE FROM ${titleChaptersSeen} c WHERE NOT EXISTS
        (SELECT 1 FROM ${titleChapterSnapshots} s WHERE s.title_key = c.title_key)`);
      return deleted.length;
    });
  }
}

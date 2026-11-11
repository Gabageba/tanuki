import { createHash } from 'node:crypto';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { CONTENT_RATING, catalogEntryFor } from '@tanuki/contracts';
import { parseLinkKey } from '../matches/title-links.service';
import type { Database } from '../database/database.service';
import { titleChapterSnapshots, USER_TITLE_SNAPSHOT_FALLBACKS } from '../database/schema';
import type { Transaction } from './library-merge.service';
import type {
  BookmarkRecord,
  BookmarkState,
  ResolvedTitleMetadata,
  TitleMetadata,
  TitleSnapshotOrigin,
} from './models';
import { SNAPSHOT_INSERT_CHUNK, SNAPSHOT_LOCK_BUCKETS, TITLE_SNAPSHOT_ORIGIN } from './models';

/** Все писатели держат shared lock, ночная чистка — exclusive. Ключ не зависит от пользователя. */
export const lockSnapshotLifecycle = async (tx: Transaction) => {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock_shared(hashtextextended('title-snapshot-lifecycle', 0))`,
  );
};

const snapshotLockBucket = (titleKey: string) =>
  createHash('sha256').update(titleKey).digest().readUInt32BE(0) % SNAPSHOT_LOCK_BUCKETS;

const lockSnapshotBucket = async (tx: Transaction, bucket: number) => {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`title-snapshot-bucket:${bucket}`}, 0))`,
  );
};

export const lockTitleSnapshot = (tx: Transaction, titleKey: string) =>
  lockSnapshotBucket(tx, snapshotLockBucket(titleKey));

export const isResolvedMetadata = (
  value: TitleMetadata | undefined,
): value is ResolvedTitleMetadata => !!value?.titleId && !!value.name;

export const snapshotOriginPriority = (origin: TitleSnapshotOrigin) => {
  switch (origin) {
    case TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS:
      return 2;
    case TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK:
      return 1;
  }
};

export const getSnapshotMetadataUpdate = (origin: TitleSnapshotOrigin) => {
  switch (origin) {
    case TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS:
      return {
        coverUrl: sql`excluded.cover_url`,
        type: sql`excluded.type`,
        contentRating: sql`coalesce(excluded.content_rating, ${titleChapterSnapshots.contentRating})`,
      };
    case TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK:
      return {
        coverUrl: sql`coalesce(excluded.cover_url, ${titleChapterSnapshots.coverUrl})`,
        type: sql`coalesce(excluded.type, ${titleChapterSnapshots.type})`,
        contentRating: sql`CASE WHEN ${titleChapterSnapshots.contentRating} = ${CONTENT_RATING.ADULT}
          THEN ${CONTENT_RATING.ADULT} ELSE coalesce(excluded.content_rating, ${titleChapterSnapshots.contentRating}) END`,
      };
  }
};

export const normalizeSnapshotRating = (
  sourceId: string,
  rating: TitleMetadata['contentRating'],
) => (catalogEntryFor(sourceId).isAdult ? CONTENT_RATING.ADULT : rating);

/** Один целостный снимок на ключ. Общий имеет приоритет даже при явно пустой обложке/типе. */
export const resolveTitleSnapshots = async (
  db: Database | Transaction,
  userId: string,
  keys: string[],
  forDisplay = false,
): Promise<Map<string, TitleMetadata>> => {
  const result = new Map<string, TitleMetadata>();
  for (let start = 0; start < keys.length; start += SNAPSHOT_INSERT_CHUNK) {
    const batch = keys.slice(start, start + SNAPSHOT_INSERT_CHUNK);
    // Один SQL-запрос видит общий снимок и резерв до или после замены, без разрыва между ними.
    const rows = await db
      .select({
        titleKey: titleChapterSnapshots.titleKey,
        titleId: sql<string | null>`${titleChapterSnapshots.titleId}`,
        name: titleChapterSnapshots.name,
        coverUrl: titleChapterSnapshots.coverUrl,
        contentRating: titleChapterSnapshots.contentRating,
        type: titleChapterSnapshots.type,
        isShared: sql<boolean>`true`,
      })
      .from(titleChapterSnapshots)
      .where(
        and(
          inArray(titleChapterSnapshots.titleKey, batch),
          isNotNull(titleChapterSnapshots.metadataOrigin),
          isNotNull(titleChapterSnapshots.name),
        ),
      )
      .unionAll(
        db
          .select({
            titleKey: USER_TITLE_SNAPSHOT_FALLBACKS.titleKey,
            titleId: USER_TITLE_SNAPSHOT_FALLBACKS.titleId,
            name: USER_TITLE_SNAPSHOT_FALLBACKS.name,
            coverUrl: USER_TITLE_SNAPSHOT_FALLBACKS.coverUrl,
            contentRating: USER_TITLE_SNAPSHOT_FALLBACKS.contentRating,
            type: USER_TITLE_SNAPSHOT_FALLBACKS.type,
            isShared: sql<boolean>`false`,
          })
          .from(USER_TITLE_SNAPSHOT_FALLBACKS)
          .where(
            and(
              eq(USER_TITLE_SNAPSHOT_FALLBACKS.userId, userId),
              inArray(USER_TITLE_SNAPSHOT_FALLBACKS.titleKey, batch),
            ),
          ),
      );
    for (const { titleKey, isShared, ...metadata } of rows) {
      if (isShared) {
        if (isResolvedMetadata(metadata)) result.set(titleKey, metadata);
      } else if (!result.has(titleKey)) {
        result.set(titleKey, {
          ...metadata,
          coverUrl: forDisplay ? safeFallbackCover(titleKey, metadata.coverUrl) : metadata.coverUrl,
          contentRating: forDisplay
            ? normalizeSnapshotRating(parseLinkKey(titleKey).sourceId, metadata.contentRating)
            : metadata.contentRating,
        });
      }
    }
  }
  return result;
};

/** Файл хранит только личный резерв. Время выбирает версию, но не доказывает доверие. */
export const writeTitleFallbacks = async (
  tx: Transaction,
  rows: (TitleMetadata & { userId: string; titleKey: string; updatedAt: Date })[],
) => {
  await lockSnapshotLifecycle(tx);
  const unique = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.userId}:${row.titleKey}`;
    const previous = unique.get(key);
    if (
      !previous ||
      (isResolvedMetadata(row) && !isResolvedMetadata(previous)) ||
      (isResolvedMetadata(row) === isResolvedMetadata(previous) &&
        row.updatedAt > previous.updatedAt)
    ) {
      unique.set(key, row);
    }
  }
  const values = [...unique.values()].sort((a, b) => a.titleKey.localeCompare(b.titleKey));
  await lockSnapshotKeys(
    tx,
    values.map((row) => row.titleKey),
  );
  for (let start = 0; start < values.length; start += SNAPSHOT_INSERT_CHUNK) {
    await tx
      .insert(USER_TITLE_SNAPSHOT_FALLBACKS)
      .values(values.slice(start, start + SNAPSHOT_INSERT_CHUNK))
      .onConflictDoUpdate({
        target: [USER_TITLE_SNAPSHOT_FALLBACKS.userId, USER_TITLE_SNAPSHOT_FALLBACKS.titleKey],
        set: {
          titleId: sql`excluded.title_id`,
          name: sql`excluded.name`,
          coverUrl: sql`excluded.cover_url`,
          contentRating: sql`excluded.content_rating`,
          type: sql`excluded.type`,
          updatedAt: sql`excluded.updated_at`,
        },
        setWhere: sql`(excluded.title_id IS NOT NULL AND excluded.name IS NOT NULL AND
          (${USER_TITLE_SNAPSHOT_FALLBACKS.titleId} IS NULL OR ${USER_TITLE_SNAPSHOT_FALLBACKS.name} IS NULL)) OR
          ((excluded.title_id IS NOT NULL AND excluded.name IS NOT NULL) =
           (${USER_TITLE_SNAPSHOT_FALLBACKS.titleId} IS NOT NULL AND ${USER_TITLE_SNAPSHOT_FALLBACKS.name} IS NOT NULL)
           AND excluded.updated_at > ${USER_TITLE_SNAPSHOT_FALLBACKS.updatedAt})`,
      });
  }
  // Не позволяем старому личному снимку воскреснуть после удаления общего.
  for (let start = 0; start < values.length; start += SNAPSHOT_INSERT_CHUNK) {
    await tx.execute(sql`DELETE FROM ${USER_TITLE_SNAPSHOT_FALLBACKS} f USING ${titleChapterSnapshots} s
      WHERE f.title_key = s.title_key AND ${inArray(
        sql`s.title_key`,
        values.slice(start, start + SNAPSHOT_INSERT_CHUNK).map((row) => row.titleKey),
      )}
        AND s.metadata_origin IS NOT NULL AND s.name IS NOT NULL`);
  }
};

/** Файл не является основанием доверять произвольному хосту img-прокси.
 * Подтверждаем лишь собственные домены источника; неизвестные CDN ждут ответа источника.
 */
export const safeFallbackCover = (titleKey: string, coverUrl: string | null) => {
  if (!coverUrl) return null;
  try {
    const { sourceId } = parseLinkKey(titleKey);
    const url = new URL(coverUrl);
    const entry = catalogEntryFor(sourceId);
    return (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username &&
      !url.password &&
      entry.domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
      ? coverUrl
      : null;
  } catch {
    return null;
  }
};

export const attachBookmarkSnapshots = (
  rows: BookmarkState[],
  metadata: Map<string, TitleMetadata>,
) =>
  rows.flatMap<BookmarkRecord>((row) => {
    const snapshot = metadata.get(row.titleKey);
    return isResolvedMetadata(snapshot) ? [{ ...row, ...snapshot }] : [];
  });

export const hydrateBookmarks = async (
  db: Database | Transaction,
  userId: string,
  rows: BookmarkState[],
) =>
  attachBookmarkSnapshots(
    rows,
    await resolveTitleSnapshots(
      db,
      userId,
      rows.map(({ titleKey }) => titleKey),
      true,
    ),
  );

export const lockSnapshotKeys = async (tx: Transaction, keys: string[]) => {
  await lockSnapshotLifecycle(tx);
  // Ограниченное число замков: большой файл не исчерпывает max_locks_per_transaction.
  // Все пакетные писатели берут бакеты в одном порядке, одиночный запрос — свой бакет.
  const buckets = [...new Set(keys.map(snapshotLockBucket))].sort((a, b) => a - b);
  for (const bucket of buckets) await lockSnapshotBucket(tx, bucket);
};

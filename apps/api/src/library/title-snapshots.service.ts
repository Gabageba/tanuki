import { Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, notExists, sql } from 'drizzle-orm';
import { normalizeChapter, titleIdOf } from '../common/normalize';
import { DatabaseService } from '../database/database.service';
import {
  bookmarks,
  readingProgress,
  titleChapterSnapshots,
  titleChaptersSeen,
} from '../database/schema';
import { linkKeyOf } from '../matches/title-links.service';
import type { RawTitle } from '../parsers-client/parsers-client.types';
import { toSnapshotBranchId } from './bookmark-groups';
import { SNAPSHOT_INSERT_CHUNK, SNAPSHOT_REFRESH_MIN_INTERVAL_MS } from './models';

/**
 * Снимки глав тайтлов — общие для всех пользователей. Каждая глава, которую хоть раз видели,
 * пишется один раз с датой, когда её увидели впервые; по этим датам и визитам считаются новые
 * главы. Пишут сюда три места одним кодом: крон, запрос списка глав со страницы тайтла (дотяжка)
 * и визит.
 */
@Injectable()
export class TitleSnapshotsService {
  private readonly logger = new Logger(TitleSnapshotsService.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Записывает главы тайтла. Первый снимок — базовый: его главы новыми не считаются, иначе
   * тайтл, добавленный до первого прохода крона, показал бы все главы новыми.
   *
   * Платные главы не пишутся: снимок общий, а их список зависит от того, кто спрашивал.
   */
  async record(
    sourceId: string,
    url: string,
    raw: RawTitle,
    { force = false }: { force?: boolean } = {},
  ): Promise<void> {
    const titleKey = linkKeyOf(sourceId, url);
    const db = this.database.db;

    const [existing] = await db
      .select({
        checkedAt: titleChapterSnapshots.checkedAt,
        missing: titleChapterSnapshots.missing,
      })
      .from(titleChapterSnapshots)
      .where(eq(titleChapterSnapshots.titleKey, titleKey))
      .limit(1);
    const isFresh =
      !!existing && Date.now() - existing.checkedAt.getTime() < SNAPSHOT_REFRESH_MIN_INTERVAL_MS;
    if (isFresh && !force) return;

    const values = {
      sourceId,
      titleId: titleIdOf(sourceId, raw),
      checkedAt: sql`now()`,
      lastError: null,
      missing: false,
    };
    await db
      .insert(titleChapterSnapshots)
      .values({ titleKey, ...values })
      .onConflictDoUpdate({ target: titleChapterSnapshots.titleKey, set: values });

    // Строка, которую оставил только сбой «не найдено» (markFailed), глав не видела — снимок всё
    // ещё первый.
    const baseline = !existing || (existing.missing && !(await this.hasSeenChapters(titleKey)));
    const chapters = (raw.chapters ?? []).filter((chapter) => !chapter.isPaid);
    for (let start = 0; start < chapters.length; start += SNAPSHOT_INSERT_CHUNK) {
      await db
        .insert(titleChaptersSeen)
        .values(
          chapters.slice(start, start + SNAPSHOT_INSERT_CHUNK).map((chapter) => ({
            titleKey,
            // Тот же Chapter.id, что получает фронт: по нему он подсвечивает новые главы.
            chapterId: normalizeChapter(sourceId, '', chapter).id,
            branchId: toSnapshotBranchId(chapter.branch),
            chapterVolume: chapter.volume,
            chapterNumber: chapter.number,
            baseline,
          })),
        )
        .onConflictDoNothing();
    }
  }

  /** Дотяжка — снимок не должен ронять страницу тайтла: ошибка только в лог. */
  recordQuietly(sourceId: string, url: string, raw: RawTitle): void {
    this.record(sourceId, url, raw).catch((error: unknown) => {
      this.logger.warn(`Снимок глав ${sourceId} не записан: ${(error as Error).message}`);
    });
  }

  /**
   * Проверка не удалась: missing — источник ответил «не найдено». Такой ответ окончательный,
   * поэтому у тайтла без снимка строка создаётся (titleId — из закладки): иначе он навсегда
   * остался бы в выборке первых снимков, а карточка не узнала бы, что тайтла нет. Временный сбой
   * строку не создаёт — первый снимок попробуют ещё раз.
   */
  async markFailed(titleKey: string, error: string, missing: boolean): Promise<void> {
    const db = this.database.db;
    const values = { checkedAt: sql`now()`, lastError: error, missing };
    if (!missing) {
      await db
        .update(titleChapterSnapshots)
        .set(values)
        .where(eq(titleChapterSnapshots.titleKey, titleKey));
      return;
    }
    const [bookmark] = await db
      .select({ sourceId: bookmarks.sourceId, titleId: bookmarks.titleId })
      .from(bookmarks)
      .where(eq(bookmarks.titleKey, titleKey))
      .limit(1);
    if (!bookmark) {
      await db
        .update(titleChapterSnapshots)
        .set(values)
        .where(eq(titleChapterSnapshots.titleKey, titleKey));
      return;
    }
    await db
      .insert(titleChapterSnapshots)
      .values({ titleKey, ...bookmark, ...values })
      .onConflictDoUpdate({ target: titleChapterSnapshots.titleKey, set: values });
  }

  private async hasSeenChapters(titleKey: string): Promise<boolean> {
    const [row] = await this.database.db
      .select({ titleKey: titleChaptersSeen.titleKey })
      .from(titleChaptersSeen)
      .where(eq(titleChaptersSeen.titleKey, titleKey))
      .limit(1);
    return !!row;
  }

  /** Chapter.id глав тайтла, впервые увиденных после визита; главы базового снимка не в счёт. */
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

  /**
   * Снимки тайтлов, которых нет ни в одних закладках и ни в одной отметке чтения: отметки
   * держат снимок, потому что карточка закладки ведёт и считает главы по источнику отметки.
   */
  async deleteOrphans(): Promise<number> {
    const db = this.database.db;
    const isOrphan = and(
      notExists(
        db
          .select({ one: sql`1` })
          .from(bookmarks)
          .where(eq(bookmarks.titleKey, titleChapterSnapshots.titleKey)),
      ),
      notExists(
        db
          .select({ one: sql`1` })
          .from(readingProgress)
          .where(eq(readingProgress.titleKey, titleChapterSnapshots.titleKey)),
      ),
    );

    return db.transaction(async (tx) => {
      const deleted = await tx
        .delete(titleChapterSnapshots)
        .where(isOrphan)
        .returning({ titleKey: titleChapterSnapshots.titleKey });
      await tx.execute(sql`
        DELETE FROM ${titleChaptersSeen}
        WHERE NOT EXISTS (
          SELECT 1 FROM ${titleChapterSnapshots}
          WHERE ${titleChapterSnapshots.titleKey} = ${titleChaptersSeen.titleKey}
        )
      `);
      return deleted.length;
    });
  }
}

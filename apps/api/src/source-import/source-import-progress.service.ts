import { setTimeout as sleep } from 'node:timers/promises';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, asc, eq, inArray, lte, sql } from 'drizzle-orm';
import type { CachedResult } from '../parsers-client/parsers-client.service';
import {
  DEFAULT_BRANCH_ID,
  NOTIFICATION_TYPE,
  SOURCE_IMPORT_PROGRESS_STATUS,
} from '@tanuki/contracts';
import { SourceAccountRequiredException } from '../common/errors';
import { groupByBranch } from '../common/normalize';
import { decodeTitleId, encodeChapterId, splitCompositeId } from '../common/opaque-id';
import { TitleSnapshotsService } from '../library/title-snapshots.service';
import { lockSnapshotLifecycle, writeTitleFallbacks } from '../library/title-snapshot-storage';
import { DatabaseService } from '../database/database.service';
import { readingProgress, sourceImportProgress } from '../database/schema';
import { TitleLinksService } from '../matches/title-links.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter, RawTitle } from '../parsers-client/parsers-client.types';
import { VIEWER_KIND } from '../source-accounts/models';
import { runAsViewer } from '../source-accounts/viewer-context';
import {
  type ChapterPosition,
  SOURCE_IMPORT_PROGRESS_BATCH_SIZE,
  SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS,
  SOURCE_IMPORT_PROGRESS_RETRY_DELAY_MS,
  SOURCE_IMPORT_RELOGIN_RECHECK_MS,
  SOURCE_IMPORT_RELOGIN_WAIT_MS,
  SOURCE_IMPORT_REQUEST_DELAY_MS,
} from './models';
import { winsSiteProgress } from './source-import-plan';

type ProgressRow = typeof sourceImportProgress.$inferSelect;

const WAITING_STATUSES = [
  SOURCE_IMPORT_PROGRESS_STATUS.PENDING,
  SOURCE_IMPORT_PROGRESS_STATUS.WAITING_RELOGIN,
];

/**
 * Глава «где остановился»: сначала в основной ветке — той же, что тайтл открывает по умолчанию,
 * иначе в следующих по величине. Ветка — команда переводчиков, и у долгих тайтлов команды
 * сменяют друг друга: ранние тома бывают только в другой ветке. Номер ищется в томе с сайта: у
 * сайтов, где нумерация начинается заново в каждом томе, глава 10 есть в нескольких томах. Тома
 * нет — номер должен стоять в одном томе во всех ветках, иначе глава не угадывается.
 */
export const findChapterByPosition = (chapters: RawChapter[], position: ChapterPosition) => {
  const candidates = chapters.filter((chapter) => chapter.number === position.chapterNumber);
  const volume =
    position.chapterVolume ??
    (new Set(candidates.map((chapter) => chapter.volume)).size === 1
      ? candidates[0]!.volume
      : undefined);
  if (volume === undefined) return null;
  // Порядок веток — по всем главам тайтла, а не по найденным: иначе решает свежесть одной главы.
  for (const { items } of groupByBranch(chapters)) {
    const chapter = items.find(
      (item) => item.number === position.chapterNumber && item.volume === volume,
    );
    if (chapter) return chapter;
  }
  return null;
};

/** Отметка импорта: точная страница, если известна, иначе начало главы. */
export const toImportedProgress = (row: ProgressRow, chapter: RawChapter) => ({
  userId: row.userId,
  titleKey: row.titleKey,
  sourceId: row.sourceId,
  chapterId: `${row.sourceId}:${encodeChapterId({ id: chapter.id, url: chapter.url, branch: chapter.branch })}`,
  chapterVolume: chapter.volume,
  chapterNumber: chapter.number,
  chapterTitle: chapter.title,
  branchId: chapter.branch ?? DEFAULT_BRANCH_ID,
  pageIndex: row.pageIndex ?? 0,
  updatedAt: new Date(),
});

/**
 * Что делать со строкой после сбоя. Сайт не принял сессию — строка ждёт повторного входа до
 * суток. Прочий сбой — ещё попытка с паузой, после последней строка пропускается.
 */
export const getFailureUpdate = (
  row: Pick<ProgressRow, 'attempts' | 'createdAt'>,
  now: Date,
  error: unknown,
): Partial<Pick<ProgressRow, 'status' | 'attempts' | 'nextAttemptAt'>> => {
  if (error instanceof SourceAccountRequiredException) {
    return now.getTime() - row.createdAt.getTime() > SOURCE_IMPORT_RELOGIN_WAIT_MS
      ? { status: SOURCE_IMPORT_PROGRESS_STATUS.SKIPPED }
      : {
          status: SOURCE_IMPORT_PROGRESS_STATUS.WAITING_RELOGIN,
          nextAttemptAt: new Date(now.getTime() + SOURCE_IMPORT_RELOGIN_RECHECK_MS),
        };
  }
  const attempts = row.attempts + 1;
  return attempts >= SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS
    ? { status: SOURCE_IMPORT_PROGRESS_STATUS.SKIPPED, attempts }
    : {
        status: SOURCE_IMPORT_PROGRESS_STATUS.PENDING,
        attempts,
        nextAttemptAt: new Date(now.getTime() + SOURCE_IMPORT_PROGRESS_RETRY_DELAY_MS),
      };
};

/**
 * Достраивает отметки «где остановился» после импорта из источника: у сайта в закладках только
 * номер главы, а отметке нужна глава — её находят детали тайтла, запрошенные от аккаунта
 * пользователя. Раз в минуту, порциями на источник, запросы к одному сайту — по одному с паузой.
 * Всё состояние в БД, так что рестарт ничего не теряет. Когда у импорта не остаётся ждущих строк,
 * приходит уведомление, и строки удаляются.
 */
@Injectable()
export class SourceImportProgressService {
  private readonly logger = new Logger(SourceImportProgressService.name);
  private isRunning = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly parsersClient: ParsersClientService,
    private readonly links: TitleLinksService,
    private readonly notifications: NotificationsService,
    private readonly snapshots: TitleSnapshotsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDue(now = new Date()): Promise<void> {
    // Прошлый проход ещё идёт (медленный сайт) — второй те же строки не берёт.
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const due = await this.database.withFallback(
        () =>
          this.database.db
            .select()
            .from(sourceImportProgress)
            .where(
              and(
                inArray(sourceImportProgress.status, WAITING_STATUSES),
                lte(sourceImportProgress.nextAttemptAt, now),
              ),
            )
            .orderBy(asc(sourceImportProgress.nextAttemptAt)),
        [] as ProgressRow[],
      );
      const bySource = new Map<string, ProgressRow[]>();
      for (const row of due) {
        const rows = bySource.get(row.sourceId) ?? [];
        if (rows.length < SOURCE_IMPORT_PROGRESS_BATCH_SIZE) rows.push(row);
        bySource.set(row.sourceId, rows);
      }

      // Сайты — параллельно, внутри сайта — по одному запросу с паузой.
      await Promise.all(
        [...bySource.values()].map(async (rows) => {
          for (const [index, row] of rows.entries()) {
            if (index > 0) await sleep(SOURCE_IMPORT_REQUEST_DELAY_MS);
            await this.processOne(row, now);
          }
        }),
      );
      await this.finishImports();
    } finally {
      this.isRunning = false;
    }
  }

  private async processOne(row: ProgressRow, now: Date): Promise<void> {
    let result: CachedResult<RawTitle>;
    try {
      const { url } = decodeTitleId(splitCompositeId(row.titleId).opaqueId);
      result = await runAsViewer({ kind: VIEWER_KIND.USER, userId: row.userId }, async () => {
        const result = await this.parsersClient.getDetails(row.sourceId, url);
        await this.snapshots.record(row.sourceId, url, result.data, result);
        return result;
      });
    } catch (error) {
      await this.markFailed(row, now, error);
      return;
    }

    const chapter = findChapterByPosition(result.data.chapters ?? [], row);
    if (!chapter) {
      await this.setStatus(row.id, { status: SOURCE_IMPORT_PROGRESS_STATUS.SKIPPED });
      return;
    }
    try {
      await this.writeProgress(row, chapter, result);
    } catch (error) {
      await this.markFailed(row, now, error);
      return;
    }
    await this.setStatus(row.id, { status: SOURCE_IMPORT_PROGRESS_STATUS.DONE });
  }

  /**
   * Отметку пишет политика, выбранная при импорте, — по отметкам всей группы на момент записи:
   * человек мог дочитать дальше, пока строка ждала. Отметки нет ни на одном источнике группы —
   * пишется всегда.
   */
  private async writeProgress(
    row: ProgressRow,
    chapter: RawChapter,
    result: CachedResult<RawTitle>,
  ) {
    let pageIndex = row.pageIndex;
    if (pageIndex != null) {
      const { data } = await runAsViewer({ kind: VIEWER_KIND.USER, userId: row.userId }, () =>
        this.parsersClient.getPages(row.sourceId, chapter.url),
      );
      if (data.items.length === 0) throw new Error('Imported chapter has no pages');
      pageIndex = Math.min(pageIndex, data.items.length - 1);
    }
    const position = { ...row, pageIndex };
    const groupKeys = [row.titleKey, ...(await this.links.listConfirmedGroup(row.titleKey))];
    const marks = await this.database.db
      .select({
        chapterVolume: readingProgress.chapterVolume,
        chapterNumber: readingProgress.chapterNumber,
        pageIndex: readingProgress.pageIndex,
        titleKey: readingProgress.titleKey,
        updatedAt: readingProgress.updatedAt,
      })
      .from(readingProgress)
      .where(
        and(eq(readingProgress.userId, row.userId), inArray(readingProgress.titleKey, groupKeys)),
      );
    const mine = marks.reduce<(typeof marks)[number] | undefined>(
      (latest, mark) => (!latest || mark.updatedAt > latest.updatedAt ? mark : latest),
      undefined,
    );
    if (!winsSiteProgress(row.progressPolicy, position, mine)) return;

    const values = toImportedProgress(position, chapter);
    // Ключ строки при конфликте не переписывается — только отметка и снимок.
    const { userId: _userId, titleKey: _titleKey, ...update } = values;
    await this.database.db.transaction(async (tx) => {
      await lockSnapshotLifecycle(tx);
      const { url } = decodeTitleId(splitCompositeId(row.titleId).opaqueId);
      if (result.stale)
        await writeTitleFallbacks(tx, [
          {
            userId: row.userId,
            titleKey: row.titleKey,
            titleId: row.titleId,
            name: result.data.title,
            coverUrl: result.data.coverUrl,
            contentRating: result.data.contentRating,
            type: result.data.type ?? null,
            updatedAt: new Date(),
          },
        ]);
      await this.snapshots.record(row.sourceId, url, result.data, { ...result, tx });
      await tx
        .insert(readingProgress)
        .values(values)
        .onConflictDoUpdate({
          target: [readingProgress.userId, readingProgress.titleKey],
          set: { ...update, hiddenAt: null },
        });
    });
  }

  private async markFailed(row: ProgressRow, now: Date, error: unknown): Promise<void> {
    if (!(error instanceof SourceAccountRequiredException)) {
      this.logger.warn(
        `Отметка импорта ${row.id} (${row.sourceId}) не достроена: ${(error as Error).message}`,
      );
    }
    await this.setStatus(row.id, getFailureUpdate(row, now, error));
  }

  /**
   * Импорты, где ждущих строк не осталось: уведомление «перенесено N из M» и уборка строк. Ищутся
   * среди всех, а не только обработанных в этом проходе: последняя ждущая строка могла уйти вместе
   * с удалённой закладкой, а импорт, на котором упало уведомление, доберёт следующий проход.
   */
  private async finishImports(): Promise<void> {
    const waiting = sql<number>`count(*) filter (where ${inArray(sourceImportProgress.status, WAITING_STATUSES)})::int`;
    const summaries = await this.database.withFallback(
      () =>
        this.database.db
          .select({
            importId: sourceImportProgress.importId,
            userId: sourceImportProgress.userId,
            sourceId: sourceImportProgress.sourceId,
            total: sql<number>`count(*)::int`,
            transferred: sql<number>`count(*) filter (where ${sourceImportProgress.status} = ${SOURCE_IMPORT_PROGRESS_STATUS.DONE})::int`,
          })
          .from(sourceImportProgress)
          .groupBy(
            sourceImportProgress.importId,
            sourceImportProgress.userId,
            sourceImportProgress.sourceId,
          )
          .having(sql`${waiting} = 0`),
      [],
    );

    for (const summary of summaries) {
      // Сбой уведомления не держит остальные импорты; строки остаются до следующего прохода.
      try {
        await this.notifications.notify(summary.userId, {
          type: NOTIFICATION_TYPE.SOURCE_IMPORT_FINISHED,
          groupKey: `source-import:${summary.importId}`,
          payload: {
            sourceId: summary.sourceId,
            transferred: summary.transferred,
            total: summary.total,
          },
        });
      } catch (error) {
        this.logger.warn(
          `Импорт ${summary.importId}: уведомление не отправлено: ${(error as Error).message}`,
        );
        continue;
      }
      await this.database.withFallback(async () => {
        await this.database.db
          .delete(sourceImportProgress)
          .where(eq(sourceImportProgress.importId, summary.importId));
        return true;
      }, false);
    }
  }

  private async setStatus(
    id: string,
    values: Partial<Pick<ProgressRow, 'status' | 'attempts' | 'nextAttemptAt'>>,
  ): Promise<void> {
    await this.database.withFallback(async () => {
      await this.database.db
        .update(sourceImportProgress)
        .set(values)
        .where(eq(sourceImportProgress.id, id));
      return true;
    }, false);
  }
}

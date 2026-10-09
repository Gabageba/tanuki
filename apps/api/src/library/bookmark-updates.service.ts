import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { asc, eq, inArray } from 'drizzle-orm';
import { CronJob } from 'cron';
import { SOURCE_STATUS } from '@tanuki/contracts';
import { NotFoundApiException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import {
  bookmarkFolders,
  bookmarks,
  readingProgress,
  titleChapterSnapshots,
} from '../database/schema';
import { parseLinkKey, TitleLinksService } from '../matches/title-links.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import { runAsService } from '../source-accounts/viewer-context';
import { SourcesService } from '../sources/sources.service';
import { BOOKMARK_SNAPSHOTS_CLEANUP_JOB_NAME, BOOKMARK_UPDATES_JOB_NAME } from './models';
import { BookmarksService } from './bookmarks.service';
import { TitleSnapshotsService } from './title-snapshots.service';

type UserKey = { userId: string; titleKey: string };

/**
 * Ключи, которые проверяет крон: закладки в отслеживаемых папках и отметки чтения тех же групп —
 * карточка считает новые главы по источнику свежей отметки, а он может быть не в закладках.
 */
export const selectTrackedKeys = (
  tracked: UserKey[],
  progress: UserKey[],
  canonical: Map<string, string>,
): string[] => {
  const keyOf = (titleKey: string) => canonical.get(titleKey) ?? titleKey;
  const trackedGroups = new Set(
    tracked.map(({ userId, titleKey }) => `${userId}|${keyOf(titleKey)}`),
  );
  const keys = new Set(tracked.map(({ titleKey }) => titleKey));
  for (const { userId, titleKey } of progress) {
    if (trackedGroups.has(`${userId}|${keyOf(titleKey)}`)) keys.add(titleKey);
  }
  return [...keys];
};

/** Давно не проверенные — первыми; ни разу не проверенные — самыми первыми. */
export const orderByStaleness = (keys: string[], checkedAt: Map<string, Date>): string[] =>
  [...keys].sort((a, b) => (checkedAt.get(a)?.getTime() ?? 0) - (checkedAt.get(b)?.getTime() ?? 0));

/**
 * Проверка новых глав у закладок: раз в несколько часов обходит тайтлы из отслеживаемых папок и
 * пишет их снимки глав. Каждый тайтл — один запрос за проход, сколько бы пользователей его ни
 * сохранили. Запросы идут обычным путём к источнику — через лимитер и breaker; источники в
 * статусе down пропускаются.
 *
 * Раз в сутки тот же сервис чистит снимки тайтлов, которых больше нет ни в одних закладках.
 */
@Injectable()
export class BookmarkUpdatesService implements OnModuleInit {
  private readonly logger = new Logger(BookmarkUpdatesService.name);
  private isRunning = false;
  /** Когда в прошлый раз сводили ленту «новых глав»; в памяти, после рестарта пусто. */
  private lastNotifiedAt: Date | null = null;

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
    private readonly links: TitleLinksService,
    private readonly parsersClient: ParsersClientService,
    private readonly sources: SourcesService,
    private readonly snapshots: TitleSnapshotsService,
    private readonly bookmarksService: BookmarksService,
    private readonly notifications: NotificationsService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    if (!this.env.BOOKMARK_UPDATES_ENABLED) {
      this.logger.log('Проверка закладок выключена (BOOKMARK_UPDATES_ENABLED=false)');
      return;
    }

    // Расписание задаётся переменной окружения — поэтому вручную, а не декоратором @Cron, как и
    // у ночного пробника.
    const updates = new CronJob(this.env.BOOKMARK_UPDATES_CRON, () => {
      void this.checkAll();
    });
    this.scheduler.addCronJob(BOOKMARK_UPDATES_JOB_NAME, updates);
    updates.start();

    const cleanup = new CronJob(this.env.BOOKMARK_SNAPSHOTS_CLEANUP_CRON, () => {
      void this.cleanup();
    });
    this.scheduler.addCronJob(BOOKMARK_SNAPSHOTS_CLEANUP_JOB_NAME, cleanup);
    cleanup.start();

    this.logger.log(`Проверка закладок запланирована: ${this.env.BOOKMARK_UPDATES_CRON}`);
  }

  async checkAll(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Проверка закладок уже идёт — пропускаем запуск');
      return;
    }

    this.isRunning = true;
    const startedAt = Date.now();
    try {
      const queue = await runAsService(() => this.buildQueue());
      const workers = Array.from({ length: this.env.BOOKMARK_UPDATES_CONCURRENCY }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          await this.checkOne(next);
        }
      });
      await Promise.all(workers);
      await this.notifyUsers(new Date(startedAt));

      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      this.logger.log(`Проверка закладок закончилась за ${elapsed}с`);
    } catch (error) {
      this.logger.warn(`Проверка закладок упала: ${(error as Error).message}`);
    } finally {
      this.isRunning = false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const deleted = await this.snapshots.deleteOrphans();
      this.logger.log(`Чистка снимков глав: удалено ${deleted}`);
    } catch (error) {
      this.logger.warn(`Чистка снимков глав упала: ${(error as Error).message}`);
    }
  }

  /**
   * После прохода: каждому, кто следит за обновлениями, сводится лента «новых глав». Считает
   * тот же код, что рисует карточки закладок, так что лента и точка на закладках не расходятся.
   */
  private async notifyUsers(runStartedAt: Date): Promise<void> {
    // Главы, увиденные после прошлого сведения, — новые, кто бы их ни записал (крон, каталог,
    // визит). После рестарта прошлого сведения нет: берём начало этого прохода.
    const since = this.lastNotifiedAt ?? runStartedAt;
    const notifiedAt = new Date();
    const rows = await this.database.db
      .selectDistinct({ userId: bookmarks.userId })
      .from(bookmarks)
      .innerJoin(bookmarkFolders, eq(bookmarkFolders.id, bookmarks.folderId))
      .where(eq(bookmarkFolders.trackUpdates, true));

    for (const { userId } of rows) {
      try {
        const snapshot = await runAsService(() =>
          this.bookmarksService.listNewChaptersGroups(userId),
        );
        await this.notifications.syncNewChapters(userId, snapshot, since);
      } catch (error) {
        this.logger.warn(`Новые главы ${userId}: ${(error as Error).message}`);
      }
    }
    this.lastNotifiedAt = notifiedAt;
  }

  private async buildQueue(): Promise<string[]> {
    const db = this.database.db;
    const tracked = await db
      .select({ userId: bookmarks.userId, titleKey: bookmarks.titleKey })
      .from(bookmarks)
      .innerJoin(bookmarkFolders, eq(bookmarkFolders.id, bookmarks.folderId))
      .where(eq(bookmarkFolders.trackUpdates, true));
    if (tracked.length === 0) return [];

    const userIds = [...new Set(tracked.map(({ userId }) => userId))];
    const progress = await db
      .select({ userId: readingProgress.userId, titleKey: readingProgress.titleKey })
      .from(readingProgress)
      .where(inArray(readingProgress.userId, userIds));
    const canonical = await this.links.listCanonicalKeys([
      ...new Set([...tracked, ...progress].map(({ titleKey }) => titleKey)),
    ]);

    const sources = await this.sources.listSources();
    const liveSources = new Set(
      sources.filter(({ status }) => status !== SOURCE_STATUS.DOWN).map(({ id }) => id),
    );
    const keys = selectTrackedKeys(tracked, progress, canonical).filter((key) =>
      liveSources.has(parseLinkKey(key).sourceId),
    );
    if (keys.length === 0) return [];

    const checked = await db
      .select({
        titleKey: titleChapterSnapshots.titleKey,
        checkedAt: titleChapterSnapshots.checkedAt,
      })
      .from(titleChapterSnapshots)
      .where(inArray(titleChapterSnapshots.titleKey, keys))
      .orderBy(asc(titleChapterSnapshots.checkedAt));
    return orderByStaleness(
      keys,
      new Map(checked.map(({ titleKey, checkedAt }) => [titleKey, checkedAt])),
    );
  }

  /** Один тайтл: детали от сервисной учётки — снимок общий для всех. */
  private async checkOne(titleKey: string): Promise<void> {
    const { sourceId, url } = parseLinkKey(titleKey);
    try {
      const { data } = await runAsService(() => this.parsersClient.getDetails(sourceId, url));
      await this.snapshots.record(sourceId, url, data, { force: true });
    } catch (error) {
      const message = (error as Error).message;
      await this.snapshots
        .markFailed(titleKey, message, error instanceof NotFoundApiException)
        .catch(() => undefined);
      this.logger.warn(`Проверка закладок: ${titleKey} — ${message}`);
    }
  }
}

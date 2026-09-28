import { Injectable } from '@nestjs/common';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { ProfileStatisticsResponse, ReadingActivityRequest } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { chapterReads, readingActivity, userSettings } from '../database/schema';
import { linkKeyOf, TitleLinksService } from '../matches/title-links.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import { findTitleChapter } from '../reading-progress/reading-progress.service';
import { computeStatistics } from './statistics';

const DEFAULT_TIME_ZONE = 'UTC';
/** Минуты из будущего и слишком старые — не от живой читалки, их не принимаем. */
const ACTIVITY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_MAX_AHEAD_MS = 60 * 1000;
/** Минуты для месяца в любой зоне: месяц плюс запас на сдвиг зоны. */
const ACTIVITY_WINDOW_MS = 33 * 24 * 60 * 60 * 1000;

@Injectable()
export class ReadingStatisticsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly links: TitleLinksService,
    private readonly parsersClient: ParsersClientService,
  ) {}

  /** Повторное прочтение ничего не меняет: в журнале остаётся первое. */
  async recordChapterRead(
    userId: string,
    sourceId: string,
    titleId: string,
    chapterId: string,
  ): Promise<void> {
    const { titleRef, details, chapter } = await findTitleChapter(
      this.parsersClient,
      sourceId,
      titleId,
      chapterId,
    );

    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .insert(chapterReads)
        .values({
          userId,
          chapterId,
          sourceId,
          titleKey: linkKeyOf(sourceId, titleRef.url),
          chapterVolume: chapter.volume,
          chapterNumber: chapter.number,
          tags: details.tags.map((tag) => tag.title),
        })
        .onConflictDoNothing();
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
  }

  /** Минута, пришедшая дважды (две вкладки), складывается, но больше 60 секунд не набирает. */
  async recordActivity(userId: string, { minutes }: ReadingActivityRequest): Promise<void> {
    const now = Date.now();
    const values = minutes
      .map(({ minute, seconds }) => ({ minute: new Date(minute), seconds }))
      .filter(({ minute }) => {
        const time = minute.getTime();
        return time <= now + ACTIVITY_MAX_AHEAD_MS && time >= now - ACTIVITY_MAX_AGE_MS;
      })
      .map(({ minute, seconds }) => {
        // Начало минуты: по нему строки и сходятся.
        minute.setUTCSeconds(0, 0);
        return { userId, minute, seconds };
      });
    if (values.length === 0) return;

    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .insert(readingActivity)
        .values(values)
        .onConflictDoUpdate({
          target: [readingActivity.userId, readingActivity.minute],
          set: { seconds: sql`LEAST(60, ${readingActivity.seconds} + excluded.seconds)` },
        });
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
  }

  async get(userId: string): Promise<ProfileStatisticsResponse> {
    const now = new Date();
    const loaded = await this.database.withFallback(async () => {
      const [reads, activity, [settings]] = await Promise.all([
        this.database.db
          .select({
            chapterId: chapterReads.chapterId,
            sourceId: chapterReads.sourceId,
            titleKey: chapterReads.titleKey,
            chapterVolume: chapterReads.chapterVolume,
            chapterNumber: chapterReads.chapterNumber,
            tags: chapterReads.tags,
            readAt: chapterReads.readAt,
          })
          .from(chapterReads)
          .where(eq(chapterReads.userId, userId)),
        this.database.db
          .select({ minute: readingActivity.minute, seconds: readingActivity.seconds })
          .from(readingActivity)
          .where(
            and(
              eq(readingActivity.userId, userId),
              gte(readingActivity.minute, new Date(now.getTime() - ACTIVITY_WINDOW_MS)),
            ),
          ),
        this.database.db
          .select({ timeZone: userSettings.timeZone })
          .from(userSettings)
          .where(eq(userSettings.userId, userId))
          .limit(1),
      ]);
      return { reads, activity, timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE };
    }, null);

    if (!loaded) throw new StorageUnavailableException();

    const titleKeys = [...new Set(loaded.reads.map((read) => read.titleKey))];
    return computeStatistics({
      ...loaded,
      canonicalKeys: await this.links.listCanonicalKeys(titleKeys),
      now,
    });
  }
}

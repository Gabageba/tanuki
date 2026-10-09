import { Injectable } from '@nestjs/common';
import { and, desc, eq, notInArray, sql } from 'drizzle-orm';
import {
  DEFAULT_SAVE_SEARCH_HISTORY,
  SEARCH_HISTORY_LIMIT,
  type SearchHistoryItem,
} from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { searchHistory, userSettings } from '../database/schema';

/** Запрос, каким он попадает в историю: без краевых пробелов и с одиночными пробелами внутри. */
export const normalizeSearchQuery = (query: string) => query.trim().replace(/\s+/g, ' ');

/** Ключ дедупликации: тот же запрос в другом регистре — та же запись. */
export const toSearchHistoryKey = (query: string) => normalizeSearchQuery(query).toLowerCase();

@Injectable()
export class SearchHistoryService {
  constructor(private readonly database: DatabaseService) {}

  /** Свежие сверху. Недоступность базы деградирует до пустой истории. */
  async list(userId: string): Promise<SearchHistoryItem[]> {
    return this.database.withFallback(async () => {
      const rows = await this.database.db
        .select({ query: searchHistory.query, searchedAt: searchHistory.searchedAt })
        .from(searchHistory)
        .where(eq(searchHistory.userId, userId))
        .orderBy(desc(searchHistory.searchedAt))
        .limit(SEARCH_HISTORY_LIMIT);
      return rows.map(({ query, searchedAt }) => ({
        query,
        searchedAt: toServerDateTime(searchedAt.getTime()),
      }));
    }, []);
  }

  /**
   * Пишет запрос в историю, если пользователь её не выключил: повтор поднимает запись наверх и
   * сохраняет последнее написание, лишние сверх лимита удаляются. Сбой базы не мешает поиску —
   * запись просто пропускается.
   */
  async record(userId: string, rawQuery: string): Promise<void> {
    const query = normalizeSearchQuery(rawQuery);
    if (!query) return;

    await this.database.withFallback(async () => {
      if (!(await this.isEnabled(userId))) return;

      await this.database.db.transaction(async (tx) => {
        await tx
          .insert(searchHistory)
          .values({ userId, query, normalizedQuery: query.toLowerCase() })
          .onConflictDoUpdate({
            target: [searchHistory.userId, searchHistory.normalizedQuery],
            set: { query, searchedAt: sql`now()` },
          });

        const kept = tx
          .select({ normalizedQuery: searchHistory.normalizedQuery })
          .from(searchHistory)
          .where(eq(searchHistory.userId, userId))
          .orderBy(desc(searchHistory.searchedAt))
          .limit(SEARCH_HISTORY_LIMIT);
        await tx
          .delete(searchHistory)
          .where(
            and(eq(searchHistory.userId, userId), notInArray(searchHistory.normalizedQuery, kept)),
          );
      });
    }, undefined);
  }

  /** Удаляет один запрос — по тому же ключу, что и дедупликация. */
  async remove(userId: string, query: string): Promise<void> {
    await this.run(() =>
      this.database.db
        .delete(searchHistory)
        .where(
          and(
            eq(searchHistory.userId, userId),
            eq(searchHistory.normalizedQuery, toSearchHistoryKey(query)),
          ),
        ),
    );
  }

  async clear(userId: string): Promise<void> {
    await this.run(() =>
      this.database.db.delete(searchHistory).where(eq(searchHistory.userId, userId)),
    );
  }

  private async isEnabled(userId: string): Promise<boolean> {
    const [row] = await this.database.db
      .select({ saveSearchHistory: userSettings.saveSearchHistory })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return row?.saveSearchHistory ?? DEFAULT_SAVE_SEARCH_HISTORY;
  }

  /** Удаление — правка пользователя: молча потерять её нельзя. */
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch {
      throw new StorageUnavailableException();
    }
  }
}

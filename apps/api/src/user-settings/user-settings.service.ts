import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { UserSettings } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { searchHistory, userSettings } from '../database/schema';

@Injectable()
export class UserSettingsService {
  constructor(private readonly database: DatabaseService) {}

  /** Недоступность базы деградирует до пустого объекта — клиент тогда остаётся на localStorage,
   *  как для гостя. */
  async get(userId: string): Promise<UserSettings> {
    return this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      if (!row) return {};
      return {
        colorScheme: row.colorScheme ?? undefined,
        viewMode: row.viewMode ?? undefined,
        language: row.language ?? undefined,
        exclusiveFilterConfirmDismissed: row.exclusiveFilterConfirmDismissed ?? undefined,
        timeZone: row.timeZone ?? undefined,
        showAdultSources: row.showAdultSources ?? undefined,
        hideAdultTitles: row.hideAdultTitles ?? undefined,
        ageConfirmed: row.ageConfirmed ?? undefined,
        saveSearchHistory: row.saveSearchHistory ?? undefined,
        collapsedSearchSources: row.collapsedSearchSources ?? undefined,
      };
    }, {});
  }

  /**
   * Патч частичный: полей, которых в нём нет, `onConflictDoUpdate` не касается, так что
   * значения, сохранённые с другого устройства, не затираются. В отличие от чтения, недоступность
   * базы здесь становится ошибкой — иначе правка молча потеряется. Выключение истории поиска
   * стирает накопленное в той же транзакции.
   */
  async update(userId: string, patch: UserSettings): Promise<UserSettings> {
    const applied = await this.database.withFallback(async () => {
      await this.database.db.transaction(async (tx) => {
        await tx
          .insert(userSettings)
          .values({ userId, ...patch })
          .onConflictDoUpdate({
            target: userSettings.userId,
            set: { ...patch, updatedAt: sql`now()` },
          });
        if (patch.saveSearchHistory === false) {
          await tx.delete(searchHistory).where(eq(searchHistory.userId, userId));
        }
      });
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
    return this.get(userId);
  }
}

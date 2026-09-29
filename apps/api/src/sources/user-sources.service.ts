import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { disabledSources } from '../database/schema';

/** Какие источники пользователь выключил в настройках. */
@Injectable()
export class UserSourcesService {
  constructor(private readonly database: DatabaseService) {}

  /** Гость и недоступная база — пустое множество: лучше показать лишнее, чем ничего. */
  async getDisabled(userId: string | undefined): Promise<ReadonlySet<string>> {
    if (!userId) return new Set();
    return this.database.withFallback(async () => {
      const rows = await this.database.db
        .select({ sourceId: disabledSources.sourceId })
        .from(disabledSources)
        .where(eq(disabledSources.userId, userId));
      return new Set(rows.map((row) => row.sourceId));
    }, new Set<string>());
  }

  async setEnabled(userId: string, sourceId: string, isEnabled: boolean): Promise<void> {
    try {
      if (isEnabled) {
        await this.database.db
          .delete(disabledSources)
          .where(and(eq(disabledSources.userId, userId), eq(disabledSources.sourceId, sourceId)));
        return;
      }
      await this.database.db
        .insert(disabledSources)
        .values({ userId, sourceId })
        .onConflictDoNothing();
    } catch {
      throw new StorageUnavailableException();
    }
  }
}

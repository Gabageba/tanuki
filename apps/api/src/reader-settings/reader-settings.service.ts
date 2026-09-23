import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DEFAULT_READER_SETTINGS, type ReaderSettings } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { readerSettings } from '../database/schema';

@Injectable()
export class ReaderSettingsService {
  constructor(private readonly database: DatabaseService) {}

  /** Недоступность базы деградирует до дефолтов — как и в остальном приложении, чтение не должно
   *  падать из-за мёртвого хранилища. */
  async get(userId: string): Promise<ReaderSettings> {
    return this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select()
        .from(readerSettings)
        .where(eq(readerSettings.userId, userId))
        .limit(1);
      if (!row) return DEFAULT_READER_SETTINGS;
      return {
        readingMode: row.readingMode,
        pageFit: row.pageFit,
        containerWidth: row.containerWidth,
        tapZoneWidth: row.tapZoneWidth,
        pageGap: row.pageGap,
        chapterGap: row.chapterGap,
      };
    }, DEFAULT_READER_SETTINGS);
  }

  /** В отличие от чтения, недоступность базы здесь становится ошибкой — иначе правка молча
   *  потеряется, а drawer покажет её сохранённой. */
  async update(userId: string, settings: ReaderSettings): Promise<ReaderSettings> {
    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .insert(readerSettings)
        .values({ userId, ...settings })
        .onConflictDoUpdate({
          target: readerSettings.userId,
          set: { ...settings, updatedAt: sql`now()` },
        });
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
    return settings;
  }
}

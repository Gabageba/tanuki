import { describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../database/database.service';
import { searchHistory } from '../database/schema';
import { UserSettingsService } from './user-settings.service';

const createService = () => {
  const deleted: unknown[] = [];
  const tx = {
    insert: () => ({ values: () => ({ onConflictDoUpdate: () => undefined }) }),
    delete: (table: unknown) => ({ where: () => deleted.push(table) }),
  };
  const database = {
    db: { transaction: (callback: (value: typeof tx) => Promise<void>) => callback(tx) },
    withFallback: (operation: () => Promise<unknown>) => operation(),
  } as unknown as DatabaseService;
  const service = new UserSettingsService(database);
  vi.spyOn(service, 'get').mockResolvedValue({});
  return { service, deleted };
};

describe('UserSettingsService.update', () => {
  it('выключение истории поиска стирает её', async () => {
    const { service, deleted } = createService();

    await service.update('user', { saveSearchHistory: false });

    expect(deleted).toEqual([searchHistory]);
  });

  it('другие правки историю не трогают', async () => {
    const { service, deleted } = createService();

    await service.update('user', { saveSearchHistory: true });
    await service.update('user', { hideAdultTitles: true });

    expect(deleted).toEqual([]);
  });
});

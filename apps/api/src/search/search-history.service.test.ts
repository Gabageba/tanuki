import { describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../database/database.service';
import { searchHistory } from '../database/schema';
import {
  normalizeSearchQuery,
  SearchHistoryService,
  toSearchHistoryKey,
} from './search-history.service';

/** База-заглушка: настройки пользователя и всё, что транзакция вставила и удалила. */
const createService = (saveSearchHistory: boolean | null | undefined) => {
  const inserted: { values: unknown; set: unknown }[] = [];
  const deleted: unknown[] = [];
  const chain = (result: unknown) => {
    const node: Record<string, unknown> = {};
    for (const method of ['from', 'where', 'orderBy']) node[method] = () => node;
    node['limit'] = () => result;
    return node;
  };
  const tx = {
    insert: () => ({
      values: (values: unknown) => ({
        onConflictDoUpdate: ({ set }: { set: unknown }) => inserted.push({ values, set }),
      }),
    }),
    select: () => chain({}),
    delete: (table: unknown) => ({ where: () => deleted.push(table) }),
  };
  const transaction = vi.fn((callback: (value: typeof tx) => Promise<void>) => callback(tx));
  const database = {
    db: {
      select: () =>
        chain(Promise.resolve(saveSearchHistory === undefined ? [] : [{ saveSearchHistory }])),
      transaction,
    },
    withFallback: (operation: () => Promise<unknown>) => operation(),
  } as unknown as DatabaseService;
  return { service: new SearchHistoryService(database), inserted, deleted, transaction };
};

describe('нормализация запроса', () => {
  it('срезает края и схлопывает пробелы внутри, регистр не трогает', () => {
    expect(normalizeSearchQuery('  Поднятие \t уровня\n в одиночку ')).toBe(
      'Поднятие уровня в одиночку',
    );
  });

  it('ключ дедупликации — тот же текст в нижнем регистре', () => {
    expect(toSearchHistoryKey(' Solo  LEVELING')).toBe('solo leveling');
    expect(toSearchHistoryKey('solo leveling')).toBe(toSearchHistoryKey('Solo Leveling'));
  });
});

describe('SearchHistoryService.record', () => {
  it('повтор поднимает запись и сохраняет последнее написание, лишние сверх лимита удаляются', async () => {
    const { service, inserted, deleted } = createService(true);

    await service.record('user', '  Solo   Leveling ');

    expect(inserted).toHaveLength(1);
    expect(inserted[0]?.values).toEqual({
      userId: 'user',
      query: 'Solo Leveling',
      normalizedQuery: 'solo leveling',
    });
    expect(inserted[0]?.set).toMatchObject({ query: 'Solo Leveling' });
    expect(deleted).toEqual([searchHistory]);
  });

  it('пишет, пока настройку не трогали', async () => {
    const { service, transaction } = createService(undefined);

    await service.record('user', 'query');

    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('не пишет, когда история выключена', async () => {
    const { service, transaction } = createService(false);

    await service.record('user', 'query');

    expect(transaction).not.toHaveBeenCalled();
  });

  it('пустой запрос не пишет', async () => {
    const { service, transaction } = createService(true);

    await service.record('user', '   ');

    expect(transaction).not.toHaveBeenCalled();
  });
});

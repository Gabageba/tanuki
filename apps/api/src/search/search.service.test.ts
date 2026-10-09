import { describe, expect, it, vi } from 'vitest';
import {
  SEARCH_GROUP_STATUS,
  SOURCE_ACCESS,
  SOURCE_LOGIN_BENEFIT,
  SEARCH_FILTER_GROUP,
  SOURCE_STATUS,
  TITLE_TYPE,
  type SearchFilterCriteria,
  type Source,
  type Title,
} from '@tanuki/contracts';
import type { CatalogService } from '../catalog/catalog.service';
import type { Env } from '../config/env';
import type { SourcesService } from '../sources/sources.service';
import type { SearchHistoryService } from './search-history.service';
import { SearchService } from './search.service';

const title = (id: string) => ({ id }) as Title;

const source = (id: string, overrides: Partial<Source> = {}) =>
  ({
    id,
    status: SOURCE_STATUS.OK,
    access: SOURCE_ACCESS.AVAILABLE,
    isSearchWithFiltersSupported: true,
    loginBenefits: [],
    isLoggedIn: false,
    ...overrides,
  }) as Source;

const createService = (sources: Source[], items: Record<string, Title[] | Error>) => {
  const record = vi.fn().mockResolvedValue(undefined);
  const listCatalog = vi.fn((sourceId: string) => {
    const result = items[sourceId] ?? [];
    return result instanceof Error ? Promise.reject(result) : Promise.resolve({ items: result });
  });
  // Источник «умеет» тип manga как фильтр `type:m`; статусов не знает.
  const resolveSearchFilters = vi.fn((_sourceId: string, criteria: SearchFilterCriteria) => ({
    filters: criteria.types?.length ? [{ groupId: 'type', key: 'm' }] : [],
    unapplied: criteria.states?.length ? [SEARCH_FILTER_GROUP.STATES] : [],
  }));
  const service = new SearchService(
    { SEARCH_TIMEOUT_MS: 1000 } as Env,
    { listSearchSources: () => Promise.resolve(sources) } as unknown as SourcesService,
    { listCatalog, resolveSearchFilters } as unknown as CatalogService,
    { record } as unknown as SearchHistoryService,
  );
  return { service, record, listCatalog, resolveSearchFilters };
};

describe('SearchService', () => {
  it('degraded и down не опрашивает, а возвращает группой unavailable на своём месте', async () => {
    const { service, listCatalog } = createService(
      [
        source('a'),
        source('b', { status: SOURCE_STATUS.DEGRADED }),
        source('c', { access: SOURCE_ACCESS.LOCKED }),
        source('d', { status: SOURCE_STATUS.DOWN }),
      ],
      { a: [title('a1')] },
    );

    const { groups } = await service.search({ query: 'q', limit: 10, userId: 'user' });

    expect(groups.map(({ sourceId, status }) => [sourceId, status])).toEqual([
      ['a', SEARCH_GROUP_STATUS.OK],
      ['b', SEARCH_GROUP_STATUS.UNAVAILABLE],
      ['c', SEARCH_GROUP_STATUS.LOCKED],
      ['d', SEARCH_GROUP_STATUS.UNAVAILABLE],
    ]);
    expect(listCatalog).toHaveBeenCalledTimes(1);
  });

  it('источник, где поиск только для вошедших, без аккаунта закрыт и не опрашивается', async () => {
    const searchBenefit = { loginBenefits: [SOURCE_LOGIN_BENEFIT.TITLE_SEARCH] };
    const { service, listCatalog } = createService(
      [source('a', searchBenefit), source('b', { ...searchBenefit, isLoggedIn: true })],
      { b: [title('b1')] },
    );

    const { groups } = await service.search({ query: 'q', limit: 10, userId: 'user' });

    expect(groups.map(({ sourceId, status }) => [sourceId, status])).toEqual([
      ['a', SEARCH_GROUP_STATUS.LOCKED],
      ['b', SEARCH_GROUP_STATUS.OK],
    ]);
    expect(listCatalog).toHaveBeenCalledTimes(1);
  });

  it('обрезает выдачу источника до лимита', async () => {
    const { service } = createService([source('a')], {
      a: [title('a1'), title('a2'), title('a3')],
    });

    const { groups } = await service.search({ query: 'q', limit: 2, userId: 'user' });

    expect(groups[0]?.items.map(({ id }) => id)).toEqual(['a1', 'a2']);
  });

  it('опрашивает только пересечение с выбранными источниками', async () => {
    const { service } = createService([source('a'), source('b')], {});

    const { groups } = await service.search({
      query: 'q',
      sourceIds: ['b', 'unknown'],
      limit: 10,
      userId: 'user',
    });

    expect(groups.map(({ sourceId }) => sourceId)).toEqual(['b']);
  });

  it('отдаёт источнику его фильтры и помечает неприменённые', async () => {
    const { service, listCatalog } = createService([source('a')], { a: [title('a1')] });

    const { groups } = await service.search({
      query: 'q',
      types: [TITLE_TYPE.MANGA],
      states: ['ongoing'],
      limit: 10,
      userId: 'user',
    });

    expect(listCatalog).toHaveBeenCalledWith('a', {
      page: 0,
      limit: 10,
      query: 'q',
      filters: [{ groupId: 'type', key: 'm' }],
    });
    expect(groups[0]?.unappliedFilters).toEqual([SEARCH_FILTER_GROUP.STATES]);
  });

  it('источник, у которого поиск не сочетается с фильтрами, ищет без них', async () => {
    const { service, listCatalog, resolveSearchFilters } = createService(
      [source('a', { isSearchWithFiltersSupported: false })],
      { a: [title('a1')] },
    );

    const { groups } = await service.search({
      query: 'q',
      types: [TITLE_TYPE.MANGA],
      limit: 10,
      userId: 'user',
    });

    expect(resolveSearchFilters).not.toHaveBeenCalled();
    expect(listCatalog).toHaveBeenCalledWith('a', {
      page: 0,
      limit: 10,
      query: 'q',
      filters: undefined,
    });
    expect(groups[0]?.unappliedFilters).toEqual([SEARCH_FILTER_GROUP.TYPES]);
  });

  it('без фильтров ничего не помечает неприменённым', async () => {
    const { service } = createService([source('a')], { a: [title('a1')] });

    const { groups } = await service.search({ query: 'q', limit: 10, userId: 'user' });

    expect(groups[0]?.unappliedFilters).toEqual([]);
  });

  it('упавший источник — error, остальные отвечают', async () => {
    const { service } = createService([source('a'), source('b')], {
      a: new Error('boom'),
      b: [title('b1')],
    });

    const { groups } = await service.search({ query: 'q', limit: 10, userId: 'user' });

    expect(groups.map(({ status }) => status)).toEqual([
      SEARCH_GROUP_STATUS.ERROR,
      SEARCH_GROUP_STATUS.OK,
    ]);
  });

  it('пишет запрос в историю', async () => {
    const { service, record } = createService([], {});

    await service.search({ query: ' Solo  Leveling ', limit: 10, userId: 'user' });

    expect(record).toHaveBeenCalledWith('user', ' Solo  Leveling ');
  });
});

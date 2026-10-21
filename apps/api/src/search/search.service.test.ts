import { lastValueFrom, toArray } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  SEARCH_GROUP_STATUS,
  SEARCH_STREAM_EVENT,
  SOURCE_ACCESS,
  SOURCE_LOGIN_BENEFIT,
  SEARCH_FILTER_GROUP,
  SOURCE_STATUS,
  TITLE_TYPE,
  type SearchFilterCriteria,
  type SearchGroup,
  type Source,
  type Title,
} from '@tanuki/contracts';
import type { CatalogService } from '../catalog/catalog.service';
import type { Env } from '../config/env';
import type { SourcesService } from '../sources/sources.service';
import type { SearchHistoryService } from './search-history.service';
import { SearchService, type SearchParams, type SearchStreamMessage } from './search.service';

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

type CatalogResult = Title[] | Error | Promise<{ items: Title[] }>;

const createService = (sources: Source[], items: Record<string, CatalogResult>) => {
  const record = vi.fn().mockResolvedValue(undefined);
  const listCatalog = vi.fn((sourceId: string) => {
    const result = items[sourceId] ?? [];
    if (result instanceof Promise) return result;
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

const collect = (service: SearchService, params: SearchParams) =>
  lastValueFrom(service.search(params).pipe(toArray()));

/** Группы потока в порядке мест — как их расставит клиент по событию `sources`. */
const searchGroups = async (service: SearchService, params: SearchParams) => {
  const events = await collect(service, params);
  const order = events.find((event) => event.type === SEARCH_STREAM_EVENT.SOURCES)?.data.sourceIds;
  const groups = events.flatMap((event) =>
    event.type === SEARCH_STREAM_EVENT.GROUP ? [event.data] : [],
  );
  return {
    groups: (order ?? []).flatMap((sourceId) =>
      groups.filter((group: SearchGroup) => group.sourceId === sourceId),
    ),
  };
};

const never = () => new Promise<{ items: Title[] }>(() => undefined);

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

    const { groups } = await searchGroups(service, { query: 'q', limit: 10, userId: 'user' });

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

    const { groups } = await searchGroups(service, { query: 'q', limit: 10, userId: 'user' });

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

    const { groups } = await searchGroups(service, { query: 'q', limit: 2, userId: 'user' });

    expect(groups[0]?.items.map(({ id }) => id)).toEqual(['a1', 'a2']);
  });

  it('опрашивает только пересечение с выбранными источниками', async () => {
    const { service } = createService([source('a'), source('b')], {});

    const { groups } = await searchGroups(service, {
      query: 'q',
      sourceIds: ['b', 'unknown'],
      limit: 10,
      userId: 'user',
    });

    expect(groups.map(({ sourceId }) => sourceId)).toEqual(['b']);
  });

  it('отдаёт источнику его фильтры и помечает неприменённые', async () => {
    const { service, listCatalog } = createService([source('a')], { a: [title('a1')] });

    const { groups } = await searchGroups(service, {
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

    const { groups } = await searchGroups(service, {
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

    const { groups } = await searchGroups(service, { query: 'q', limit: 10, userId: 'user' });

    expect(groups[0]?.unappliedFilters).toEqual([]);
  });

  it('упавший источник — error, остальные отвечают', async () => {
    const { service } = createService([source('a'), source('b')], {
      a: new Error('boom'),
      b: [title('b1')],
    });

    const { groups } = await searchGroups(service, { query: 'q', limit: 10, userId: 'user' });

    expect(groups.map(({ status }) => status)).toEqual([
      SEARCH_GROUP_STATUS.ERROR,
      SEARCH_GROUP_STATUS.OK,
    ]);
  });

  it('пишет запрос в историю', async () => {
    const { service, record } = createService([], {});

    await collect(service, { query: ' Solo  Leveling ', limit: 10, userId: 'user' });

    expect(record).toHaveBeenCalledWith('user', ' Solo  Leveling ');
  });

  it('повтор по не ответившим в историю не пишет', async () => {
    const { service, record } = createService([source('a')], {});

    await collect(service, { query: 'q', limit: 10, userId: 'user', isRetry: true });

    expect(record).not.toHaveBeenCalled();
  });

  it('шлёт sources, затем группы по готовности, затем done', async () => {
    let resolveA: (value: { items: Title[] }) => void = () => undefined;
    const slowA = new Promise<{ items: Title[] }>((resolve) => (resolveA = resolve));
    const { service } = createService(
      [source('a'), source('b'), source('c', { access: SOURCE_ACCESS.LOCKED })],
      { a: slowA, b: [title('b1')] },
    );

    const events: SearchStreamMessage[] = [];
    const finished = new Promise<void>((resolve) => {
      service.search({ query: 'q', limit: 10, userId: 'user' }).subscribe({
        next: (event) => {
          events.push(event);
          // a отвечает, только когда b уже пришёл: группы идут по готовности, а не по местам.
          if (event.type === SEARCH_STREAM_EVENT.GROUP && event.data.sourceId === 'b') {
            resolveA({ items: [title('a1')] });
          }
        },
        complete: resolve,
      });
    });
    await finished;

    expect(
      events.map((event) =>
        event.type === SEARCH_STREAM_EVENT.GROUP ? `group:${event.data.sourceId}` : event.type,
      ),
    ).toEqual([
      SEARCH_STREAM_EVENT.SOURCES,
      'group:c',
      'group:b',
      'group:a',
      SEARCH_STREAM_EVENT.DONE,
    ]);
    expect(events[0]).toEqual({
      type: SEARCH_STREAM_EVENT.SOURCES,
      data: { sourceIds: ['a', 'b', 'c'] },
    });
  });

  it('по дедлайну не ответившие уходят timeout, затем done', async () => {
    vi.useFakeTimers();
    try {
      const { service } = createService([source('a'), source('b')], {
        a: [title('a1')],
        b: never(),
      });

      const result = collect(service, { query: 'q', limit: 10, userId: 'user' });
      await vi.advanceTimersByTimeAsync(1000);
      const events = await result;

      expect(
        events.map((event) =>
          event.type === SEARCH_STREAM_EVENT.GROUP
            ? `${event.data.sourceId}:${event.data.status}`
            : event.type,
        ),
      ).toEqual([
        SEARCH_STREAM_EVENT.SOURCES,
        `a:${SEARCH_GROUP_STATUS.OK}`,
        `b:${SEARCH_GROUP_STATUS.TIMEOUT}`,
        SEARCH_STREAM_EVENT.DONE,
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('без источников — sources пустой и сразу done', async () => {
    const { service } = createService([], {});

    const events = await collect(service, { query: 'q', limit: 10, userId: 'user' });

    expect(events).toEqual([
      { type: SEARCH_STREAM_EVENT.SOURCES, data: { sourceIds: [] } },
      { type: SEARCH_STREAM_EVENT.DONE, data: {} },
    ]);
  });

  it('после отписки больше ничего не шлёт', async () => {
    let resolveA: (value: { items: Title[] }) => void = () => undefined;
    const slowA = new Promise<{ items: Title[] }>((resolve) => (resolveA = resolve));
    const { service } = createService([source('a')], { a: slowA });

    const next = vi.fn();
    const subscription = service.search({ query: 'q', limit: 10, userId: 'user' }).subscribe(next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledTimes(1));
    subscription.unsubscribe();
    resolveA({ items: [title('a1')] });
    await slowA;

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ type: SEARCH_STREAM_EVENT.SOURCES });
  });
});

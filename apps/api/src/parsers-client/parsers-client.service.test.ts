import { afterEach, describe, expect, it, vi } from 'vitest';
import { SORT_ORDER } from '@tanuki/contracts';
import { ParsersClientService } from './parsers-client.service';

const setup = () => {
  const values = new Map<string, unknown>();
  const parser = { getHomeSection: vi.fn(async () => ({ items: [], hasNextPage: false })) };
  const registry = {
    ready: async () => {},
    get: () => parser,
    listSources: vi.fn(() => [{ month: new Date().toISOString().slice(0, 7) }]),
  };
  const cache = {
    getOrSet: vi.fn(async <T>(key: string, _ttl: unknown, fetch: () => Promise<T>) => {
      if (!values.has(key)) values.set(key, await fetch());
      return { value: values.get(key), stale: false, fromCache: true };
    }),
  };
  const dependencies = [
    registry,
    cache,
    { canAttempt: () => true, recordSuccess: vi.fn() },
    { recordSuccess: vi.fn() },
    { run: async (_sourceId: string, task: () => Promise<unknown>) => task() },
    { resolveScope: async () => undefined },
  ] as unknown as ConstructorParameters<typeof ParsersClientService>;
  return { service: new ParsersClientService(...dependencies), parser, registry, cache };
};

afterEach(() => vi.useRealTimers());

describe('ParsersClientService selections cache', () => {
  it('isolates order, concrete month and page, reusing the same combination', async () => {
    const { service, parser } = setup();
    const request = { page: 1, variant: '2026-11', order: SORT_ORDER.LIKES };
    await service.getHomeSection('nudemoon', 'popular', request);
    await service.getHomeSection('nudemoon', 'popular', request);
    await service.getHomeSection('nudemoon', 'popular', { ...request, order: SORT_ORDER.VIEWS });
    await service.getHomeSection('nudemoon', 'popular', { ...request, variant: '2026-10' });
    await service.getHomeSection('nudemoon', 'popular', { ...request, page: 2 });
    expect(parser.getHomeSection).toHaveBeenCalledTimes(4);
  });

  it('rebuilds metadata in a new calendar month without a process restart', async () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-12-31T23:59:59Z');
    const { service, registry } = setup();
    expect((await service.getSources()).data.items[0]).toEqual({ month: '2026-12' });
    vi.setSystemTime('2027-01-01T00:00:00Z');
    expect((await service.getSources()).data.items[0]).toEqual({ month: '2027-01' });
    expect(registry.listSources).toHaveBeenCalledTimes(2);
  });
});

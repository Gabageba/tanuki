import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env';
import { CacheService } from './cache.service';

const REDIS = vi.hoisted(() => new Map<string, string>());
vi.mock('ioredis', () => ({
  default: class {
    on() {}
    async get(key: string) {
      return REDIS.get(key) ?? null;
    }
    async set(key: string, value: string) {
      REDIS.set(key, value);
    }
  },
}));
afterEach(() => {
  REDIS.clear();
  vi.useRealTimers();
});

describe('CacheService source timestamps', () => {
  it('cache hit и stale fallback сохраняют время запроса источника', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const service = new CacheService({ REDIS_URL: 'redis://unused' } as Env);
    const ttl = { freshSeconds: 10, staleSeconds: 100 };
    const fetch = vi.fn(async () => {
      vi.setSystemTime(2_000);
      return 'source';
    });
    expect(await service.getOrSet('key', ttl, fetch)).toMatchObject({
      fetchedAt: 1_000,
      stale: false,
    });
    vi.setSystemTime(5_000);
    expect(await service.getOrSet('key', ttl, fetch)).toMatchObject({
      fetchedAt: 1_000,
      fromCache: true,
    });
    vi.setSystemTime(30_000);
    expect(
      await service.getOrSet('key', ttl, async () => {
        throw new Error('offline');
      }),
    ).toMatchObject({ fetchedAt: 1_000, stale: true, value: 'source' });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('старый envelope использует storedAt, а не время чтения кеша', async () => {
    REDIS.set('legacy', JSON.stringify({ value: 'old', storedAt: Date.now() - 1_000 }));
    const service = new CacheService({ REDIS_URL: 'redis://unused' } as Env);
    const result = await service.getOrSet(
      'legacy',
      { freshSeconds: 10, staleSeconds: 100 },
      async () => 'new',
    );
    expect(result.fetchedAt).toBe(JSON.parse(REDIS.get('legacy')!).storedAt);
  });
});

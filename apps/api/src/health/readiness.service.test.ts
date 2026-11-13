import { describe, expect, it, vi } from 'vitest';
import { ReadinessService } from './readiness.service';
import type { DatabaseService } from '../database/database.service';
import type { CacheService } from '../cache/cache.service';
import type { RateLimitService } from '../rate-limit/rate-limit.service';

const service = (
  database: () => Promise<unknown>,
  cache: () => Promise<unknown>,
  rateLimit = async () => {},
) =>
  new ReadinessService(
    { ping: database } as DatabaseService,
    { ping: cache } as CacheService,
    { ping: rateLimit } as RateLimitService,
  );

describe('readiness', () => {
  it('requires all dependencies, hides their errors and times out', async () => {
    expect(
      await service(
        async () => {},
        async () => {},
      ).check(),
    ).toEqual({ status: 'ok' });
    await expect(
      service(
        async () => {
          throw new Error('postgres://secret');
        },
        async () => {},
      ).check(),
    ).rejects.toMatchObject({ status: 503, message: 'Service Unavailable' });
    await expect(
      service(
        async () => {},
        async () => {},
        async () => {
          throw new Error('rate-limit unavailable');
        },
      ).check(),
    ).rejects.toMatchObject({ status: 503 });
    vi.useFakeTimers();
    try {
      const pending = service(
        () => new Promise(() => {}),
        async () => {},
      ).check();
      const rejected = expect(pending).rejects.toMatchObject({ status: 503 });
      await vi.advanceTimersByTimeAsync(2001);
      await rejected;
    } finally {
      vi.useRealTimers();
    }
  });
});

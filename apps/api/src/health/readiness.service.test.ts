import { describe, expect, it, vi } from 'vitest';
import { ReadinessService } from './readiness.service';
import type { DatabaseService } from '../database/database.service';
import type { CacheService } from '../cache/cache.service';

const service = (database: () => Promise<unknown>, cache: () => Promise<unknown>) =>
  new ReadinessService({ ping: database } as DatabaseService, { ping: cache } as CacheService);

describe('readiness', () => {
  it('requires both dependencies, hides their errors and times out', async () => {
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

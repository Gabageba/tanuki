import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import type { CacheTtlSpec } from './cache.constants';

type CacheEnvelope<T> = {
  value: T;
  storedAt: number;
  fetchedAt?: number;
};

export type CacheResult<T> = {
  value: T;
  stale: boolean;
  /** Значение взято из кеша, а не только что получено fetch'ем. */
  fromCache: boolean;
  fetchedAt?: number;
};

export type GetOrSetOptions<T> = {
  force?: boolean;
  /**
   * Что из свежего значения можно положить в общий кеш. Вызывающий получает значение целиком,
   * а в кеш уходит только общая для всех часть — например, без глав, купленных этим аккаунтом.
   */
  toShared?: (value: T) => T;
};

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readinessQuery: Promise<void> | undefined;

  constructor(@Inject(ENV) env: Env) {
    this.redis = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    this.redis.on('error', (error: Error) => {
      this.logger.warn(`Valkey error: ${error.message}`);
    });
  }

  /**
   * Отдаёт свежее значение из кеша, иначе вызывает fetch. Если fetch падает, но в кеше есть
   * хоть протухший envelope (не старше staleSeconds), отдаёт его с stale: true вместо ошибки.
   * Любая ошибка самого Redis-клиента тихо деградирует в прямой вызов fetch — мёртвый Valkey
   * не должен становиться новым источником простоя. options.force игнорирует freshSeconds и
   * идёт за fetch безусловно (ручное обновление), но fallback на протухший envelope при ошибке
   * работает как обычно.
   */
  async getOrSet<T>(
    key: string,
    ttl: CacheTtlSpec,
    fetch: () => Promise<T>,
    options?: GetOrSetOptions<T>,
  ): Promise<CacheResult<T>> {
    const envelope = await this.readEnvelope<T>(key);

    if (!options?.force && envelope && Date.now() - envelope.storedAt < ttl.freshSeconds * 1000) {
      return {
        value: envelope.value,
        stale: false,
        fromCache: true,
        fetchedAt: envelope.fetchedAt ?? envelope.storedAt,
      };
    }

    try {
      const fetchedAt = Date.now();
      const value = await fetch();
      const shared = options?.toShared ? options.toShared(value) : value;
      await this.writeEnvelope(key, ttl, { value: shared, storedAt: Date.now(), fetchedAt });
      return { value, stale: false, fromCache: false, fetchedAt };
    } catch (error) {
      if (envelope) {
        return {
          value: envelope.value,
          stale: true,
          fromCache: true,
          fetchedAt: envelope.fetchedAt ?? envelope.storedAt,
        };
      }
      throw error;
    }
  }

  private async readEnvelope<T>(key: string): Promise<CacheEnvelope<T> | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as CacheEnvelope<T>) : null;
    } catch (error) {
      this.logger.warn(`Cache read failed for ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  private async writeEnvelope<T>(
    key: string,
    ttl: CacheTtlSpec,
    envelope: CacheEnvelope<T>,
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(envelope), 'EX', ttl.staleSeconds);
    } catch (error) {
      this.logger.warn(`Cache write failed for ${key}: ${(error as Error).message}`);
    }
  }

  /** Сбрасывает весь namespace `cache:*` — используется дев-инструментом сброса кеша. */
  async flushAll(): Promise<void> {
    const stream = this.redis.scanStream({ match: 'cache:*', count: 100 });
    const pipeline = this.redis.pipeline();
    let hasKeys = false;

    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length > 0) {
        hasKeys = true;
        pipeline.del(...keys);
      }
    }

    if (hasKeys) {
      await pipeline.exec();
    }
  }

  async ping(): Promise<void> {
    this.readinessQuery ??= this.redis
      .ping()
      .then(() => undefined)
      .finally(() => {
        this.readinessQuery = undefined;
      });
    await this.readinessQuery;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}

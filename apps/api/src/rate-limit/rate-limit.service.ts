import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { TooManyRequestsException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';

/**
 * Лимитер на Valkey (отдельное подключение от CacheService — тот кеширует ответы источников,
 * здесь же простой INCR-счётчик со своим namespace). Недоступный Redis не должен блокировать
 * вход/регистрацию — при ошибке клиента лимит просто не применяется, как и в CacheService.
 */
@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis: Redis;

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

  /** Бросает TooManyRequestsException, если по ключу уже исчерпан лимит за окно windowSeconds. */
  async consume(key: string, limit: number, windowSeconds: number): Promise<void> {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.expire(redisKey, windowSeconds);
      }
      if (count > limit) {
        const ttl = await this.redis.ttl(redisKey);
        throw new TooManyRequestsException(ttl > 0 ? ttl : windowSeconds);
      }
    } catch (error) {
      if (error instanceof TooManyRequestsException) throw error;
      this.logger.warn(`Rate limit check failed for ${key}: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}

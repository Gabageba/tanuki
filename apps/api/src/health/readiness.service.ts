import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { DatabaseService } from '../database/database.service';
import { HEALTH_STATUS, type HealthStatus } from './models';
import { RateLimitService } from '../rate-limit/rate-limit.service';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly database: DatabaseService,
    private readonly cache: CacheService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async check(): Promise<{ status: HealthStatus }> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        Promise.all([this.database.ping(), this.cache.ping(), this.rateLimit.ping()]),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error('Readiness timeout')), 2000);
        }),
      ]);
      return { status: HEALTH_STATUS.OK };
    } catch {
      throw new ServiceUnavailableException();
    } finally {
      clearTimeout(timeout);
    }
  }
}

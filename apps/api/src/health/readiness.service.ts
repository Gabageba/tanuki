import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { DatabaseService } from '../database/database.service';
import { HEALTH_STATUS, type HealthStatus } from './models';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly database: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  async check(): Promise<{ status: HealthStatus }> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        Promise.all([this.database.ping(), this.cache.ping()]),
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

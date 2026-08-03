import { Global, Module } from '@nestjs/common';
import { ConcurrencyLimiterService } from './concurrency-limiter.service';
import { SourceHealthService } from './source-health.service';

@Global()
@Module({
  providers: [SourceHealthService, ConcurrencyLimiterService],
  exports: [SourceHealthService, ConcurrencyLimiterService],
})
export class ResilienceModule {}

import { Global, Module } from '@nestjs/common';
import { ConcurrencyLimiterService } from './concurrency-limiter.service';
import { SourceHealthService } from './source-health.service';
import { SourceStatusService } from './source-status.service';

@Global()
@Module({
  providers: [SourceHealthService, SourceStatusService, ConcurrencyLimiterService],
  exports: [SourceHealthService, SourceStatusService, ConcurrencyLimiterService],
})
export class ResilienceModule {}

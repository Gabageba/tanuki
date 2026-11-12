import { Module } from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import { HealthController } from './health.controller';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  providers: [ReadinessService],
  controllers: [HealthController],
})
export class HealthModule {}

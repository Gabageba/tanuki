import { Module } from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import { HealthController } from './health.controller';

@Module({
  providers: [ReadinessService],
  controllers: [HealthController],
})
export class HealthModule {}

import { Controller, Get } from '@nestjs/common';
import { HEALTH_STATUS, type HealthStatus } from './models';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: HealthStatus } {
    return { status: HEALTH_STATUS.ok };
  }
}

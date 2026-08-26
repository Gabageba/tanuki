import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health.dto';
import { HEALTH_STATUS, type HealthStatus } from './models';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOkResponse({ type: HealthResponseDto })
  @Get()
  check(): { status: HealthStatus } {
    return { status: HEALTH_STATUS.ok };
  }
}

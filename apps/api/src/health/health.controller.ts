import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { HealthResponseDto } from './health.dto';
import { ReadinessService } from './readiness.service';
import { HEALTH_STATUS, type HealthStatus } from './models';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Public()
  @ApiOkResponse({ type: HealthResponseDto })
  @Get('ready')
  ready() {
    return this.readiness.check();
  }

  @ApiOkResponse({ type: HealthResponseDto })
  @Public()
  @Get()
  check(): { status: HealthStatus } {
    return { status: HEALTH_STATUS.OK };
  }
}

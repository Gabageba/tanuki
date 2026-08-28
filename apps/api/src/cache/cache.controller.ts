import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CacheService } from './cache.service';

@ApiTags('cache')
@Controller('cache')
export class CacheController {
  constructor(private readonly cache: CacheService) {}

  @ApiOperation({ summary: 'Сбрасывает весь кеш (дев-инструмент)' })
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async flush(): Promise<void> {
    await this.cache.flushAll();
  }
}

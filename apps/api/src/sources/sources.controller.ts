import { Controller, Delete, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Source, SourcesResponse } from '@tanuki/contracts';
import { SourceDto, SourcesResponseDto } from './sources.dto';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @ApiOkResponse({
    type: SourcesResponseDto,
    description: 'Источники, сгруппированные по contentType',
  })
  @Get()
  async list(): Promise<SourcesResponse> {
    return this.sourcesService.listGroupedSources();
  }

  @ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. READMANGA' })
  @ApiOkResponse({ type: SourceDto })
  @Get(':sourceId')
  async get(@Param('sourceId') sourceId: string): Promise<Source> {
    return this.sourcesService.getSource(sourceId);
  }

  @ApiOperation({
    summary: 'Сбрасывает нестабильность источника — circuit breaker (дев-инструмент)',
  })
  @ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. READMANGA' })
  @Delete(':sourceId/health')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetHealth(@Param('sourceId') sourceId: string): Promise<void> {
    await this.sourcesService.resetHealth(sourceId);
  }
}

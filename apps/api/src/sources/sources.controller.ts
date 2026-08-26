import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
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
}

import { Controller, Get, Param } from '@nestjs/common';
import type { Source, SourcesResponse } from '@tanuki/contracts';
import { SourcesService } from './sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async list(): Promise<SourcesResponse> {
    return this.sourcesService.listGroupedSources();
  }

  @Get(':sourceId')
  async get(@Param('sourceId') sourceId: string): Promise<Source> {
    return this.sourcesService.getSource(sourceId);
  }
}

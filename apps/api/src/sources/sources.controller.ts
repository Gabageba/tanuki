import { Controller, Get } from '@nestjs/common';
import type { SourcesResponse } from '@tanuki/contracts';
import { SourcesService } from './sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async list(): Promise<SourcesResponse> {
    return this.sourcesService.listGroupedSources();
  }
}

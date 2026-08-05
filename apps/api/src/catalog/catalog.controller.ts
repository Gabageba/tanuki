import { Controller, Get, Param, Query } from '@nestjs/common';
import type { CatalogResponse } from '@tanuki/contracts';
import { CatalogService } from './catalog.service';

@Controller('sources/:sourceId')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('manga')
  async list(
    @Param('sourceId') sourceId: string,
    @Query('page') page: string | undefined,
    @Query('order') order: string | undefined,
    @Query('query') query: string | undefined,
    @Query('refresh') refresh: string | undefined,
  ): Promise<CatalogResponse> {
    return this.catalogService.listCatalog(sourceId, {
      page: page ? Number.parseInt(page, 10) : 0,
      order,
      query,
      force: refresh === 'true',
    });
  }
}

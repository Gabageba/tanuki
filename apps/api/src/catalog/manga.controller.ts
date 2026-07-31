import { Controller, Get, Param, Query } from '@nestjs/common';
import type { ChaptersResponse, MangaDetailsResponse, PagesResponse } from '@tanuki/contracts';
import { CatalogService } from './catalog.service';

@Controller('manga/:sourceId/:mangaId')
export class MangaController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async details(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
  ): Promise<MangaDetailsResponse> {
    return this.catalogService.getMangaDetails(sourceId, mangaId);
  }

  @Get('chapters')
  async chapters(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
    @Query('branch') branch: string | undefined,
  ): Promise<ChaptersResponse> {
    return this.catalogService.listChapters(sourceId, mangaId, branch);
  }

  @Get('chapters/:chapterId/pages')
  async pages(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<PagesResponse> {
    return this.catalogService.getPages(sourceId, mangaId, chapterId);
  }
}

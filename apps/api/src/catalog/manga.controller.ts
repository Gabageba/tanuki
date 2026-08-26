import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ChaptersResponse, MangaDetailsResponse, PagesResponse } from '@tanuki/contracts';
import { CatalogService } from './catalog.service';
import { ChaptersResponseDto, MangaDetailsResponseDto, PagesResponseDto } from './manga.dto';

@ApiTags('manga')
@ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. READMANGA' })
@ApiParam({ name: 'mangaId' })
@Controller('manga/:sourceId/:mangaId')
export class MangaController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOkResponse({ type: MangaDetailsResponseDto })
  @Get()
  async details(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
  ): Promise<MangaDetailsResponse> {
    return this.catalogService.getMangaDetails(sourceId, mangaId);
  }

  @ApiQuery({ name: 'branch', required: false, type: String })
  @ApiOkResponse({ type: ChaptersResponseDto })
  @Get('chapters')
  async chapters(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
    @Query('branch') branch: string | undefined,
  ): Promise<ChaptersResponse> {
    return this.catalogService.listChapters(sourceId, mangaId, branch);
  }

  @ApiParam({ name: 'chapterId' })
  @ApiOkResponse({ type: PagesResponseDto })
  @Get('chapters/:chapterId/pages')
  async pages(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<PagesResponse> {
    return this.catalogService.getPages(sourceId, mangaId, chapterId);
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ChaptersResponse, MangaDetailsResponse, PagesResponse } from '@tanuki/contracts';
import { splitCompositeId } from '../common/opaque-id';
import { CatalogService } from './catalog.service';
import { ChaptersResponseDto, MangaDetailsResponseDto, PagesResponseDto } from './manga.dto';

@ApiTags('manga')
@ApiParam({ name: 'mangaId', description: 'Составной id тайтла — "sourceId:opaqueId"' })
@Controller('manga/:mangaId')
export class MangaController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOkResponse({ type: MangaDetailsResponseDto })
  @Get()
  async details(@Param('mangaId') mangaId: string): Promise<MangaDetailsResponse> {
    const { sourceId, opaqueId } = splitCompositeId(mangaId);
    return this.catalogService.getMangaDetails(sourceId, opaqueId);
  }

  @ApiQuery({ name: 'branch', required: false, type: String })
  @ApiOkResponse({ type: ChaptersResponseDto })
  @Get('chapters')
  async chapters(
    @Param('mangaId') mangaId: string,
    @Query('branch') branch: string | undefined,
  ): Promise<ChaptersResponse> {
    const { sourceId, opaqueId } = splitCompositeId(mangaId);
    return this.catalogService.listChapters(sourceId, opaqueId, branch);
  }

  @ApiParam({ name: 'chapterId', description: 'Составной id главы — "sourceId:opaqueId"' })
  @ApiOkResponse({ type: PagesResponseDto })
  @Get('chapters/:chapterId/pages')
  async pages(
    @Param('mangaId') mangaId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<PagesResponse> {
    const { sourceId, opaqueId } = splitCompositeId(mangaId);
    return this.catalogService.getPages(sourceId, opaqueId, splitCompositeId(chapterId).opaqueId);
  }
}

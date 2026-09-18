import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ChaptersResponse, TitleDetailsResponse, PagesResponse } from '@tanuki/contracts';
import { splitCompositeId } from '../common/opaque-id';
import { CatalogService } from './catalog.service';
import { ChaptersResponseDto, TitleDetailsResponseDto, PagesResponseDto } from './title.dto';

@ApiTags('titles')
@ApiParam({ name: 'titleId', description: 'Составной id тайтла — "sourceId:opaqueId"' })
@Controller('titles/:titleId')
export class TitleController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOkResponse({ type: TitleDetailsResponseDto })
  @Get()
  async details(@Param('titleId') titleId: string): Promise<TitleDetailsResponse> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    return this.catalogService.getTitleDetails(sourceId, opaqueId);
  }

  @ApiQuery({ name: 'branch', required: false, type: String })
  @ApiOkResponse({ type: ChaptersResponseDto })
  @Get('chapters')
  async chapters(
    @Param('titleId') titleId: string,
    @Query('branch') branch: string | undefined,
  ): Promise<ChaptersResponse> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    return this.catalogService.listChapters(sourceId, opaqueId, branch);
  }

  @ApiParam({ name: 'chapterId', description: 'Составной id главы — "sourceId:opaqueId"' })
  @ApiOkResponse({ type: PagesResponseDto })
  @Get('chapters/:chapterId/pages')
  async pages(
    @Param('titleId') titleId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<PagesResponse> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    return this.catalogService.getPages(sourceId, opaqueId, splitCompositeId(chapterId).opaqueId);
  }
}

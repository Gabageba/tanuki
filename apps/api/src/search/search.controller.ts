import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { SearchResponse } from '@tanuki/contracts';
import { BadRequestApiException } from '../common/errors';
import { SearchResponseDto } from './search.dto';
import { SearchService } from './search.service';

const DEFAULT_LIMIT = 10;

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: String,
    description: 'Список sourceId через запятую; по умолчанию — все источники',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: SearchResponseDto })
  @Get()
  async search(
    @Query('query') query: string | undefined,
    @Query('sources') sources: string | undefined,
    @Query('limit') limit: string | undefined,
  ): Promise<SearchResponse> {
    if (!query) {
      throw new BadRequestApiException('searchQueryMissing');
    }

    const sourceIds = sources
      ? sources
          .split(',')
          .map((sourceId) => sourceId.trim())
          .filter(Boolean)
      : undefined;

    return this.searchService.search(
      query,
      sourceIds,
      limit ? Number.parseInt(limit, 10) : DEFAULT_LIMIT,
    );
  }
}

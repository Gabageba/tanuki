import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import type { SearchResponse } from '@tanuki/contracts';
import { SearchService } from './search.service';

const DEFAULT_LIMIT = 10;

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('query') query: string | undefined,
    @Query('sources') sources: string | undefined,
    @Query('limit') limit: string | undefined,
  ): Promise<SearchResponse> {
    if (!query) {
      throw new BadRequestException('query is required');
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

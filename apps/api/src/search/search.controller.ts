import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TitleStateSchema, TitleTypeSchema, type SearchResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { BadRequestApiException } from '../common/errors';
import { parseEnumListParam, parseListParam } from './parse-search-params';
import { SearchResponseDto } from './search.dto';
import { SearchService } from './search.service';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parseLimit = (raw: string | undefined) => {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isInteger(value) && value >= 1 ? Math.min(value, MAX_LIMIT) : DEFAULT_LIMIT;
};

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
  @ApiQuery({
    name: 'types',
    required: false,
    type: String,
    description:
      'Значения TITLE_TYPE через запятую; источник, не умеющий этот фильтр, помечается в unappliedFilters',
  })
  @ApiQuery({
    name: 'states',
    required: false,
    type: String,
    description:
      'Значения TITLE_STATE через запятую; источник, не умеющий этот фильтр, помечается в unappliedFilters',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: SearchResponseDto })
  @Get()
  async search(
    @CurrentUser() user: SessionUser,
    @Query('query') query: string | undefined,
    @Query('sources') sources: string | undefined,
    @Query('types') types: string | undefined,
    @Query('states') states: string | undefined,
    @Query('limit') limit: string | undefined,
  ): Promise<SearchResponse> {
    if (!query?.trim()) {
      throw new BadRequestApiException('searchQueryMissing');
    }

    return this.searchService.search({
      query,
      sourceIds: parseListParam(sources),
      types: parseEnumListParam(types, TitleTypeSchema),
      states: parseEnumListParam(states, TitleStateSchema),
      limit: parseLimit(limit),
      userId: user.id,
    });
  }
}

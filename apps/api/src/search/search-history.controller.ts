import { Controller, Delete, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { SearchHistoryResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { SearchHistoryResponseDto } from './search.dto';
import { SearchHistoryService } from './search-history.service';

@ApiTags('search')
@Controller('search/history')
export class SearchHistoryController {
  constructor(private readonly searchHistory: SearchHistoryService) {}

  @ApiOperation({ summary: 'Недавние запросы поиска, свежие сверху' })
  @ApiOkResponse({ type: SearchHistoryResponseDto })
  @Get()
  async list(@CurrentUser() user: SessionUser): Promise<SearchHistoryResponse> {
    return { items: await this.searchHistory.list(user.id) };
  }

  @ApiOperation({
    summary: 'Удаляет запрос из недавних (без учёта регистра и пробелов), без query — очищает все',
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async remove(
    @CurrentUser() user: SessionUser,
    @Query('query') query: string | undefined,
  ): Promise<void> {
    if (query === undefined) {
      await this.searchHistory.clear(user.id);
      return;
    }
    await this.searchHistory.remove(user.id, query);
  }
}

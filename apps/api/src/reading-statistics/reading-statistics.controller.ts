import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ProfileStatisticsResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { splitCompositeId } from '../common/opaque-id';
import {
  ChapterReadRequestDto,
  ProfileStatisticsResponseDto,
  ReadingActivityRequestDto,
} from './reading-statistics.dto';
import { ReadingStatisticsService } from './reading-statistics.service';

@ApiTags('reading-statistics')
@Controller()
export class ReadingStatisticsController {
  constructor(private readonly readingStatisticsService: ReadingStatisticsService) {}

  @ApiOperation({ summary: 'Отмечает главу прочитанной — читатель дошёл до последней страницы' })
  @ApiParam({ name: 'titleId', description: 'Составной id тайтла — "sourceId:opaqueId"' })
  @ApiBody({ type: ChapterReadRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('titles/:titleId/chapter-reads')
  async recordChapterRead(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
    @Body() body: ChapterReadRequestDto,
  ): Promise<void> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    await this.readingStatisticsService.recordChapterRead(
      user.id,
      sourceId,
      opaqueId,
      body.chapterId,
    );
  }

  @ApiOperation({ summary: 'Секунды активного чтения, разложенные по минутам' })
  @ApiBody({ type: ReadingActivityRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('reading-activity')
  async recordActivity(
    @CurrentUser() user: SessionUser,
    @Body() body: ReadingActivityRequestDto,
  ): Promise<void> {
    await this.readingStatisticsService.recordActivity(user.id, body);
  }

  @ApiOperation({ summary: 'Статистика чтения текущего пользователя' })
  @ApiOkResponse({ type: ProfileStatisticsResponseDto })
  @Get('users/me/statistics')
  async get(@CurrentUser() user: SessionUser): Promise<ProfileStatisticsResponse> {
    return this.readingStatisticsService.get(user.id);
  }
}

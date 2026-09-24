import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ReadingProgress, TitleReadingProgressResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { splitCompositeId } from '../common/opaque-id';
import {
  ReadingProgressDto,
  TitleReadingProgressResponseDto,
  UpdateReadingProgressRequestDto,
} from './reading-progress.dto';
import { ReadingProgressService } from './reading-progress.service';

/** Отдельно от TitleController по той же причине, что и MatchesController: прогрессу нужны
 *  связи тайтлов из MatchesModule, а CatalogModule их не знает. */
@ApiTags('titles')
@ApiParam({ name: 'titleId', description: 'Составной id тайтла — "sourceId:opaqueId"' })
@Controller('titles/:titleId/progress')
export class ReadingProgressController {
  constructor(private readonly readingProgressService: ReadingProgressService) {}

  @ApiOperation({
    summary: 'Где пользователь остановился: на этом тайтле и на его подтверждённых совпадениях',
  })
  @ApiOkResponse({ type: TitleReadingProgressResponseDto })
  @Get()
  async get(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
  ): Promise<TitleReadingProgressResponse> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    return this.readingProgressService.get(user.id, sourceId, opaqueId);
  }

  @ApiOperation({ summary: 'Сохраняет главу и страницу, на которой остановились' })
  @ApiBody({ type: UpdateReadingProgressRequestDto })
  @ApiOkResponse({ type: ReadingProgressDto })
  @Put()
  async update(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
    @Body() body: UpdateReadingProgressRequestDto,
  ): Promise<ReadingProgress> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    return this.readingProgressService.update(user.id, sourceId, opaqueId, body);
  }
}

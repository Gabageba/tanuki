import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type {
  RemoveTitleBookmarkResponse,
  TitleBookmark,
  TitleBookmarkVisitResponse,
} from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { BookmarksService } from './bookmarks.service';
import {
  RemoveTitleBookmarkResponseDto,
  SetTitleBookmarkRequestDto,
  TitleBookmarkDto,
  TitleBookmarkVisitResponseDto,
} from './library.dto';

/** Закладка конкретного тайтла — отдельно от TitleController по той же причине, что и прогресс:
 *  ей нужны связи тайтлов, а CatalogModule их не знает. */
@ApiTags('titles')
@ApiParam({ name: 'titleId', description: 'Составной id тайтла — "sourceId:opaqueId"' })
@Controller('titles/:titleId/bookmark')
export class TitleBookmarkController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @ApiOperation({ summary: 'Папка тайтла с учётом его подтверждённых совпадений' })
  @ApiOkResponse({ type: TitleBookmarkDto })
  @Get()
  async get(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
  ): Promise<TitleBookmark> {
    return this.bookmarksService.getForTitle(user.id, titleId);
  }

  @ApiOperation({ summary: 'Кладёт тайтл в папку или переносит туда всю его группу' })
  @ApiBody({ type: SetTitleBookmarkRequestDto })
  @ApiOkResponse({ type: TitleBookmarkDto })
  @Put()
  async set(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
    @Body() body: SetTitleBookmarkRequestDto,
  ): Promise<TitleBookmark> {
    return this.bookmarksService.setForTitle(user.id, titleId, body.folderId);
  }

  @ApiOperation({ summary: 'Убирает закладку всей группы и отдаёт строки для «Вернуть»' })
  @ApiOkResponse({ type: RemoveTitleBookmarkResponseDto })
  @Delete()
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
  ): Promise<RemoveTitleBookmarkResponse> {
    return { rows: await this.bookmarksService.removeForTitle(user.id, titleId) };
  }

  @ApiOperation({ summary: 'Засчитывает визит и отдаёт главы, вышедшие с прошлого' })
  @ApiOkResponse({ type: TitleBookmarkVisitResponseDto })
  @HttpCode(HttpStatus.OK)
  @Post('visit')
  async visit(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
  ): Promise<TitleBookmarkVisitResponse> {
    return { newChapterIds: await this.bookmarksService.visit(user.id, titleId) };
  }
}

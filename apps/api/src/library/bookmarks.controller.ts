import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  BookmarksLookupResponse,
  BookmarksResponse,
  NewChapterBookmarksResponse,
} from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { BookmarksService } from './bookmarks.service';
import {
  BookmarksLookupRequestDto,
  BookmarksLookupResponseDto,
  BookmarksQueryDto,
  BookmarksResponseDto,
  NewChapterBookmarksResponseDto,
  RestoreBookmarksRequestDto,
} from './library.dto';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @ApiOperation({ summary: 'Закладки папки — по одной на группу подтверждённых совпадений' })
  @ApiOkResponse({ type: BookmarksResponseDto })
  @Get()
  async list(
    @CurrentUser() user: SessionUser,
    @Query() query: BookmarksQueryDto,
  ): Promise<BookmarksResponse> {
    return this.bookmarksService.list(user.id, query);
  }

  @ApiOperation({
    summary: '«Новые главы в закладках» на главной: отслеживаемые папки, свежая глава первой',
  })
  @ApiOkResponse({ type: NewChapterBookmarksResponseDto })
  @Get('new-chapters')
  async newChapters(@CurrentUser() user: SessionUser): Promise<NewChapterBookmarksResponse> {
    return this.bookmarksService.listNewChapters(user.id);
  }

  @ApiOperation({ summary: 'Папки тайтлов для меток на карточках каталога и поиска' })
  @ApiBody({ type: BookmarksLookupRequestDto })
  @ApiOkResponse({ type: BookmarksLookupResponseDto })
  @HttpCode(HttpStatus.OK)
  @Post('lookup')
  async lookup(
    @CurrentUser() user: SessionUser,
    @Body() body: BookmarksLookupRequestDto,
  ): Promise<BookmarksLookupResponse> {
    return this.bookmarksService.lookup(user.id, body.titleIds);
  }

  @ApiOperation({ summary: 'Возвращает строки закладки, удалённые «Убрать из закладок»' })
  @ApiBody({ type: RestoreBookmarksRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('restore')
  async restore(
    @CurrentUser() user: SessionUser,
    @Body() body: RestoreBookmarksRequestDto,
  ): Promise<void> {
    await this.bookmarksService.restore(user.id, body.rows);
  }
}

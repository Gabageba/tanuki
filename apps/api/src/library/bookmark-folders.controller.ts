import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BookmarkFolder, BookmarkFoldersResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { BookmarkFoldersService, type BookmarkFolderRecord } from './bookmark-folders.service';
import { BookmarksService } from './bookmarks.service';
import {
  BookmarkFolderDto,
  BookmarkFoldersResponseDto,
  CreateBookmarkFolderRequestDto,
  DeleteBookmarkFolderQueryDto,
  ReorderBookmarkFoldersRequestDto,
  UpdateBookmarkFolderRequestDto,
} from './library.dto';

/** Только что созданная папка — пустая. */
const toNewFolder = (folder: BookmarkFolderRecord): BookmarkFolder => ({
  id: folder.id,
  builtIn: folder.builtIn,
  name: folder.name,
  icon: folder.icon,
  color: folder.color,
  trackUpdates: folder.trackUpdates,
  count: 0,
  newCount: 0,
});

@ApiTags('bookmarks')
@Controller('bookmark-folders')
export class BookmarkFoldersController {
  constructor(
    private readonly folders: BookmarkFoldersService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  @ApiOperation({ summary: 'Папки по порядку вкладок со счётчиками и признаком новых глав' })
  @ApiOkResponse({ type: BookmarkFoldersResponseDto })
  @Get()
  async list(@CurrentUser() user: SessionUser): Promise<BookmarkFoldersResponse> {
    return this.bookmarksService.listFolders(user.id);
  }

  @ApiOperation({ summary: 'Создаёт свою папку' })
  @ApiBody({ type: CreateBookmarkFolderRequestDto })
  @ApiOkResponse({ type: BookmarkFolderDto })
  @Post()
  async create(
    @CurrentUser() user: SessionUser,
    @Body() body: CreateBookmarkFolderRequestDto,
  ): Promise<BookmarkFolder> {
    return toNewFolder(await this.folders.create(user.id, body));
  }

  @ApiOperation({ summary: 'Меняет порядок всех папок' })
  @ApiBody({ type: ReorderBookmarkFoldersRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('order')
  async reorder(
    @CurrentUser() user: SessionUser,
    @Body() body: ReorderBookmarkFoldersRequestDto,
  ): Promise<void> {
    await this.folders.reorder(user.id, body.ids);
  }

  @ApiOperation({ summary: 'Переименовывает папку или меняет её флаг «Следить за обновлениями»' })
  @ApiBody({ type: UpdateBookmarkFolderRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id')
  async update(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBookmarkFolderRequestDto,
  ): Promise<void> {
    await this.folders.update(user.id, id, body);
  }

  @ApiOperation({ summary: 'Удаляет свою папку: закладки переносит в moveTo или удаляет' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteBookmarkFolderQueryDto,
  ): Promise<void> {
    await this.folders.delete(user.id, id, query.moveTo);
  }
}

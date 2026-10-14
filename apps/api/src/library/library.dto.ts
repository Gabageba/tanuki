import { createZodDto } from 'nestjs-zod';
import {
  BookmarkFolderSchema,
  BookmarkFoldersResponseSchema,
  BookmarksLookupRequestSchema,
  BookmarksLookupResponseSchema,
  BookmarksQuerySchema,
  BookmarksResponseSchema,
  NewChapterBookmarksResponseSchema,
  CreateBookmarkFolderRequestSchema,
  DeleteBookmarkFolderQuerySchema,
  RemoveTitleBookmarkResponseSchema,
  ReorderBookmarkFoldersRequestSchema,
  RestoreBookmarksRequestSchema,
  SetTitleBookmarkRequestSchema,
  TitleBookmarkSchema,
  TitleBookmarkVisitResponseSchema,
  UpdateBookmarkFolderRequestSchema,
} from '@tanuki/contracts';

export class BookmarkFolderDto extends createZodDto(BookmarkFolderSchema) {}
export class BookmarkFoldersResponseDto extends createZodDto(BookmarkFoldersResponseSchema) {}
export class CreateBookmarkFolderRequestDto extends createZodDto(
  CreateBookmarkFolderRequestSchema,
) {}
export class UpdateBookmarkFolderRequestDto extends createZodDto(
  UpdateBookmarkFolderRequestSchema,
) {}
export class ReorderBookmarkFoldersRequestDto extends createZodDto(
  ReorderBookmarkFoldersRequestSchema,
) {}
export class DeleteBookmarkFolderQueryDto extends createZodDto(DeleteBookmarkFolderQuerySchema) {}

export class BookmarksQueryDto extends createZodDto(BookmarksQuerySchema) {}
export class BookmarksResponseDto extends createZodDto(BookmarksResponseSchema) {}

export class NewChapterBookmarksResponseDto extends createZodDto(
  NewChapterBookmarksResponseSchema,
) {}
export class BookmarksLookupRequestDto extends createZodDto(BookmarksLookupRequestSchema) {}
export class BookmarksLookupResponseDto extends createZodDto(BookmarksLookupResponseSchema) {}
export class RestoreBookmarksRequestDto extends createZodDto(RestoreBookmarksRequestSchema) {}

export class TitleBookmarkDto extends createZodDto(TitleBookmarkSchema) {}
export class SetTitleBookmarkRequestDto extends createZodDto(SetTitleBookmarkRequestSchema) {}
export class RemoveTitleBookmarkResponseDto extends createZodDto(
  RemoveTitleBookmarkResponseSchema,
) {}
export class TitleBookmarkVisitResponseDto extends createZodDto(TitleBookmarkVisitResponseSchema) {}

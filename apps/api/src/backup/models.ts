import type {
  BackupBookmark,
  BackupChapterRead,
  BackupFolder,
  BackupProgress,
  BackupReadingActivity,
} from '@tanuki/contracts';
import type { readingProgress } from '../database/schema';
import type { FolderRef, GroupMove } from '../library/library-merge';

export type { FolderRef, FolderTarget, GroupMove } from '../library/library-merge';

/** Отметка пользователя — столько, сколько нужно, чтобы сравнить её с отметкой из копии. */
export type ProgressMark = Pick<
  typeof readingProgress.$inferSelect,
  'titleKey' | 'chapterId' | 'chapterNumber' | 'pageIndex' | 'updatedAt'
>;

export type BookmarkInsert = {
  row: BackupBookmark;
  titleKey: string;
  sourceId: string;
  folder: FolderRef;
};

/** «Что куда ляжет» — общий расчёт сводки и записи: сводка его только считает. */
export type RestorePlan = {
  folderCreates: BackupFolder[];
  bookmarkInserts: BookmarkInsert[];
  groupMoves: GroupMove[];
  progressUpserts: BackupProgress[];
  chapterReads: BackupChapterRead[];
  readingActivity: BackupReadingActivity[];
  counts: {
    bookmarksAdded: number;
    bookmarksSameFolder: number;
    bookmarksOtherFolder: number;
    bookmarksMoved: number;
    bookmarksSkipped: number;
    titlesToPlanned: number;
    foldersAdded: number;
    foldersMatched: number;
    foldersOverLimit: number;
    progressAdded: number;
    progressDiffers: number;
    progressUpdated: number;
    progressSkipped: number;
    chapterReadsAdded: number;
    chapterReadsSkipped: number;
  };
};

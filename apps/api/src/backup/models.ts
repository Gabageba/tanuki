import type {
  BackupBookmark,
  BackupChapterRead,
  BackupFolder,
  BackupProgress,
  BackupReadingActivity,
} from '@tanuki/contracts';
import type { readingProgress } from '../database/schema';

/** Отметка пользователя — столько, сколько нужно, чтобы сравнить её с отметкой из копии. */
export type ProgressMark = Pick<
  typeof readingProgress.$inferSelect,
  'titleKey' | 'chapterId' | 'chapterNumber' | 'pageIndex' | 'updatedAt'
>;

/** Куда ляжет закладка: в папку, что уже есть, или в ту, что восстановление создаст. */
export type FolderRef = { id: string; key?: undefined } | { id?: undefined; key: string };

/** Папка из копии и её место у пользователя. `isOverLimit` — своя папка не поместилась в лимит,
 *  её тайтлы ложатся во «В планах». */
export type FolderTarget = { ref: FolderRef; isOverLimit: boolean };

export type BookmarkInsert = {
  row: BackupBookmark;
  titleKey: string;
  sourceId: string;
  folder: FolderRef;
};

/** Перенос всех строк группы пользователя в папку из копии («Взять из копии»). */
export type GroupMove = { titleKeys: string[]; folder: FolderRef };

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

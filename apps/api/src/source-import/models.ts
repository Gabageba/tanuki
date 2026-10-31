import type { SourceImportFolder } from '@tanuki/contracts';
import type { readingProgress } from '../database/schema';
import type { GroupMove, MergeBookmarkInsert, MergeFolder } from '../library/library-merge';

/** Отметка пользователя — столько, сколько нужно, чтобы сравнить её с «где остановился» сайта. */
export type ImportProgressMark = Pick<
  typeof readingProgress.$inferSelect,
  'titleKey' | 'chapterVolume' | 'chapterNumber' | 'updatedAt'
> & { pageIndex?: number | null };

/** Место главы: номер и том — у сайтов, где нумерация начинается заново в каждом томе, номер
 *  без тома неоднозначен. Том null — сайт его не отдаёт. */
export type ChapterPosition = {
  chapterVolume: number | null;
  chapterNumber: number;
  /** Страницы сравниваются только для одного тайтла на одном источнике. */
  titleKey?: string;
  pageIndex?: number | null;
};

/** Отметка, которую крон достроит по главе с сайта. */
export type PendingProgress = ChapterPosition & {
  titleKey: string;
  titleId: string;
};

/** «Что куда ляжет» — общий расчёт сводки и записи импорта: сводка берёт из него только папки. */
export type SourceImportPlan = {
  folders: SourceImportFolder[];
  folderCreates: MergeFolder[];
  bookmarkInserts: MergeBookmarkInsert[];
  groupMoves: GroupMove[];
  pendingProgress: PendingProgress[];
  counts: {
    bookmarksAdded: number;
    bookmarksAsSource: number;
    bookmarksMoved: number;
    titlesToPlanned: number;
    foldersCreated: number;
    foldersMatched: number;
    foldersOverLimit: number;
  };
};

/** Столько попыток достроить одну отметку, прежде чем пропустить её. */
export const SOURCE_IMPORT_PROGRESS_MAX_ATTEMPTS = 3;
/** Пауза перед следующей попыткой после сбоя источника. */
export const SOURCE_IMPORT_PROGRESS_RETRY_DELAY_MS = 5 * 60_000;
/** Сколько ждать повторного входа на сайт, прежде чем пропустить отметки. */
export const SOURCE_IMPORT_RELOGIN_WAIT_MS = 24 * 60 * 60_000;
/** Сколько отметок одного источника крон достраивает за проход. */
export const SOURCE_IMPORT_PROGRESS_BATCH_SIZE = 20;
/** Пауза между запросами к одному сайту — чтобы не упереться в его рейт-лимит. */
export const SOURCE_IMPORT_REQUEST_DELAY_MS = 1_000;
/** Через сколько повторить отметку, ждущую повторного входа. */
export const SOURCE_IMPORT_RELOGIN_RECHECK_MS = 30 * 60_000;

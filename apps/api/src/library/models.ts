import type { BookmarkAvailability } from '@tanuki/contracts';
import type { bookmarks, readingProgress, titleChapterSnapshots } from '../database/schema';

export type BookmarkRecord = typeof bookmarks.$inferSelect;

export type ProgressRecord = Pick<
  typeof readingProgress.$inferSelect,
  'titleKey' | 'sourceId' | 'branchId' | 'chapterVolume' | 'chapterNumber' | 'updatedAt'
>;

export type SnapshotRecord = Pick<
  typeof titleChapterSnapshots.$inferSelect,
  'titleKey' | 'titleId' | 'checkedAt' | 'missing' | 'chaptersCount'
>;

/** Копия тайтла, куда может вести карточка: titleId известен, доступность посчитана. */
export type BookmarkCandidate = {
  titleKey: string;
  sourceId: string;
  titleId: string;
  availability: BookmarkAvailability;
};

/**
 * Закладка с точки зрения пользователя — группа подтверждённых совпадений со всеми её строками
 * закладок и отметками чтения, до подсчёта глав.
 */
export type BookmarkGroup = {
  /** Канонический ключ группы (TitleLinksService.listCanonicalKeys). */
  key: string;
  rows: BookmarkRecord[];
  /** Папка группы; при разошедшихся папках — папка самой свежей строки. */
  folderId: string;
  /** Разные папки строк группы, свежая первой; одна папка — конфликта нет. */
  folderIds: string[];
  /** Откуда взяты название, обложка, рейтинг и тип — строка цели или самая ранняя. */
  snapshot: BookmarkRecord;
  target: BookmarkCandidate;
  /** Отметка чтения цели; null — на цели не читали. */
  progress: ProgressRecord | null;
  otherSources: BookmarkCandidate[];
  /** Самый поздний визит в группу. */
  visitedAt: Date;
  /** Когда группу впервые положили в закладки. */
  createdAt: Date;
  /** Когда в группе последний раз читали; null — не читали. */
  readAt: Date | null;
  /** Когда цель последний раз проверяли; null — ещё ни разу. */
  checkedAt: Date | null;
  /** Сколько глав у цели на источнике по снимку; null — неизвестно или тайтл пропал. */
  sourceChaptersCount: number | null;
};

/** Сколько глав в ветке тайтла и сколько из них новых с визита. */
export type BranchStat = {
  titleKey: string;
  branchId: string;
  total: number;
  /** Порядковый номер главы отметки в ветке (сколько глав до неё включительно); null — отметки нет. */
  position: number | null;
  newCount: number;
  /** Когда впервые увидели самую свежую из новых; null — новых нет. */
  latestNewAt: Date | null;
  /** Номер последней главы ветки — в том же порядке (том, номер), что и position. */
  latestNumber: number | null;
};

/** Группа после подсчёта глав — то, из чего собирается BookmarkItem. */
export type CountedBookmarkGroup = BookmarkGroup & {
  branchTotal: number | null;
  branchPosition: number | null;
  newChaptersCount: number;
  latestNewAt: Date | null;
  latestChapterNumber: number | null;
};

/**
 * Названия встроенных папок на всех языках интерфейса — своя папка не может называться так же:
 * после смены языка две вкладки выглядели бы одинаково.
 */
export const BUILT_IN_BOOKMARK_FOLDER_NAMES = [
  'читаю',
  'в планах',
  'прочитано',
  'брошено',
  'reading',
  'planned',
  'completed',
  'dropped',
];

export const BOOKMARK_UPDATES_JOB_NAME = 'bookmark-updates';
export const BOOKMARK_SNAPSHOTS_CLEANUP_JOB_NAME = 'bookmark-snapshots-cleanup';
export const BOOKMARK_SNAPSHOTS_FILL_JOB_NAME = 'bookmark-snapshots-fill';

/** Сколько первых снимков одного источника снимать за минутный проход. */
export const BOOKMARK_SNAPSHOTS_FILL_BATCH_SIZE = 20;
/** Пауза между запросами к одному сайту — чтобы импорт сотни закладок не упёрся в рейт-лимит. */
export const BOOKMARK_SNAPSHOTS_FILL_REQUEST_DELAY_MS = 1_000;
/** Через сколько повторить первый снимок, который не удался. */
export const BOOKMARK_SNAPSHOTS_FILL_RETRY_MS = 30 * 60_000;

/** Чаще этого страница тайтла снимок не переписывает — список глав грузится по веткам. */
export const SNAPSHOT_REFRESH_MIN_INTERVAL_MS = 5 * 60_000;

/** Сколько строк глав вставлять за раз: Postgres ограничивает число параметров запроса. */
export const SNAPSHOT_INSERT_CHUNK = 1000;

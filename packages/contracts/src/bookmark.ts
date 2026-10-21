import { z } from 'zod';
import { SORT_DIRECTION, SortDirectionSchema, type SortDirection } from './source';
import { ContentRatingSchema, TitleTypeSchema } from './title';
import type { EnumLiteralsOf } from './utils';

/**
 * Встроенные папки — ровно четыре, у каждого пользователя. Название переводит фронт, иконку и
 * цвет задаёт он же; переименовать или удалить их нельзя, менять — только порядок и флаг
 * «Следить за обновлениями».
 */
export const BUILT_IN_BOOKMARK_FOLDER = {
  READING: 'reading',
  PLANNED: 'planned',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const;
export type BuiltInBookmarkFolder = EnumLiteralsOf<typeof BUILT_IN_BOOKMARK_FOLDER>;

export const BuiltInBookmarkFolderSchema = z.enum(BUILT_IN_BOOKMARK_FOLDER);

/** Иконки своих папок. Первые четыре после закладки — у встроенных, но доступны и своим. */
export const BOOKMARK_FOLDER_ICON = {
  BOOKMARK: 'bookmark',
  BOOK_OPEN: 'bookOpen',
  CLOCK: 'clock',
  CHECK_CIRCLE: 'checkCircle',
  ARCHIVE: 'archive',
  HEART: 'heart',
  STAR: 'star',
  FIRE: 'fire',
  LIGHTNING: 'lightning',
  CROWN: 'crown',
  SWORD: 'sword',
  GHOST: 'ghost',
  MOON: 'moon',
  LEAF: 'leaf',
  COFFEE: 'coffee',
  SMILEY: 'smiley',
  FLAG: 'flag',
  PUZZLE: 'puzzle',
} as const;
export type BookmarkFolderIcon = EnumLiteralsOf<typeof BOOKMARK_FOLDER_ICON>;

export const BookmarkFolderIconSchema = z.enum(BOOKMARK_FOLDER_ICON);

/**
 * Цвета папок — и встроенных, и своих: стандартная палитра Mantine без цветов приложения
 * (terracotta — акцент, moss/gold/crimson — статусы, amber — рейтинг), чтобы папка не читалась как
 * статус. Значения — имена цветов Mantine: фронт подставляет их в `var(--mantine-color-<color>-*)`.
 */
export const BOOKMARK_FOLDER_COLOR = {
  BLUE: 'blue',
  CYAN: 'cyan',
  TEAL: 'teal',
  LIME: 'lime',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  PINK: 'pink',
  GRAPE: 'grape',
  VIOLET: 'violet',
  INDIGO: 'indigo',
  GRAY: 'gray',
} as const;
export type BookmarkFolderColor = EnumLiteralsOf<typeof BOOKMARK_FOLDER_COLOR>;

export const BookmarkFolderColorSchema = z.enum(BOOKMARK_FOLDER_COLOR);

/** Порядок списка закладок. По умолчанию — UPDATED. */
export const BOOKMARK_SORT = {
  /** Свежая новая глава первой, без новых — по дате проверки. */
  UPDATED: 'updated',
  /** Последнее чтение в группе. */
  READ: 'read',
  /** Дата добавления. */
  ADDED: 'added',
  /** По снимку названия. */
  ALPHABETICAL: 'alphabetical',
} as const;
export type BookmarkSort = EnumLiteralsOf<typeof BOOKMARK_SORT>;

export const BookmarkSortSchema = z.enum(BOOKMARK_SORT);

/** Естественное направление сортировки: даты — свежие первыми, алфавит — от «А». */
export const getDefaultBookmarkSortDirection = (sort: BookmarkSort): SortDirection => {
  switch (sort) {
    case BOOKMARK_SORT.UPDATED:
    case BOOKMARK_SORT.READ:
    case BOOKMARK_SORT.ADDED:
      return SORT_DIRECTION.DESC;
    case BOOKMARK_SORT.ALPHABETICAL:
      return SORT_DIRECTION.ASC;
  }
};

/** Можно ли открыть закладку: у недоступной в группе не осталось ни одного живого источника. */
export const BOOKMARK_AVAILABILITY = {
  AVAILABLE: 'available',
  /** Выключен в настройках или скрыт настройкой 18+. */
  SOURCE_DISABLED: 'sourceDisabled',
  /** source_health = down. */
  SOURCE_DOWN: 'sourceDown',
  /** Источник ответил «не найдено». */
  TITLE_MISSING: 'titleMissing',
} as const;
export type BookmarkAvailability = EnumLiteralsOf<typeof BOOKMARK_AVAILABILITY>;

export const BookmarkAvailabilitySchema = z.enum(BOOKMARK_AVAILABILITY);

/** Сколько своих папок можно завести. Встроенные в лимит не входят. */
export const CUSTOM_BOOKMARK_FOLDERS_LIMIT = 20;
/** Длина названия своей папки после trim. */
export const BOOKMARK_FOLDER_NAME_MAX_LENGTH = 32;
export const BOOKMARKS_PAGE_SIZE = 30;

export const BookmarkFolderSchema = z.object({
  id: z.string().uuid(),
  /** null — своя папка. */
  builtIn: BuiltInBookmarkFolderSchema.nullable(),
  /** У встроенных null: название, иконку и цвет задаёт фронт. */
  name: z.string().nullable(),
  icon: BookmarkFolderIconSchema.nullable(),
  color: BookmarkFolderColorSchema.nullable(),
  trackUpdates: z.boolean(),
  /** Сколько тайтлов (групп подтверждённых совпадений) в папке. */
  count: z.number().int().min(0),
  /** Сколько из них с новыми главами; у папки без trackUpdates всегда 0. */
  newCount: z.number().int().min(0),
});
export type BookmarkFolder = z.infer<typeof BookmarkFolderSchema>;

export const BookmarkFoldersResponseSchema = z.object({
  /** По порядку вкладок. */
  items: z.array(BookmarkFolderSchema),
  /** Есть ли новые главы хоть в одной отслеживаемой папке — точка в шапке и футере. */
  hasNew: z.boolean(),
});
export type BookmarkFoldersResponse = z.infer<typeof BookmarkFoldersResponseSchema>;

const BookmarkFolderNameSchema = z.string().trim().min(1).max(BOOKMARK_FOLDER_NAME_MAX_LENGTH);

export const CreateBookmarkFolderRequestSchema = z.object({
  name: BookmarkFolderNameSchema,
  icon: BookmarkFolderIconSchema,
  color: BookmarkFolderColorSchema,
  trackUpdates: z.boolean(),
});
export type CreateBookmarkFolderRequest = z.infer<typeof CreateBookmarkFolderRequestSchema>;

/** У встроенной папки меняется только trackUpdates — остальное отвечает ошибкой. */
export const UpdateBookmarkFolderRequestSchema = z.object({
  name: BookmarkFolderNameSchema.optional(),
  icon: BookmarkFolderIconSchema.optional(),
  color: BookmarkFolderColorSchema.optional(),
  trackUpdates: z.boolean().optional(),
});
export type UpdateBookmarkFolderRequest = z.infer<typeof UpdateBookmarkFolderRequestSchema>;

/** Все папки пользователя в новом порядке. */
export const ReorderBookmarkFoldersRequestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
export type ReorderBookmarkFoldersRequest = z.infer<typeof ReorderBookmarkFoldersRequestSchema>;

export const DeleteBookmarkFolderQuerySchema = z.object({
  /** Куда перенести закладки папки; нет — закладки удаляются вместе с ней. */
  moveTo: z.string().uuid().optional(),
});
export type DeleteBookmarkFolderQuery = z.infer<typeof DeleteBookmarkFolderQuerySchema>;

export const BookmarksQuerySchema = z.object({
  folderId: z.string().uuid(),
  sort: BookmarkSortSchema.default(BOOKMARK_SORT.UPDATED),
  /** Нет — естественное направление сортировки (`getDefaultBookmarkSortDirection`). */
  direction: SortDirectionSchema.optional(),
  /** Подстрока снимка названия без учёта регистра. */
  query: z.string().trim().max(100).optional(),
  /** С единицы. */
  page: z.coerce.number().int().min(1).default(1),
});
export type BookmarksQuery = z.infer<typeof BookmarksQuerySchema>;

/** Копия тайтла на другом источнике группы — куда ведёт пункт меню источников на карточке. */
export const BookmarkSourceSchema = z.object({
  sourceId: z.string(),
  titleId: z.string(),
});
export type BookmarkSource = z.infer<typeof BookmarkSourceSchema>;

/**
 * Где остановился: номер главы отметки, её порядковый номер в ветке и сколько глав в ветке (null —
 * ветку ещё не проверяли). С total сравнивается position, а не chapterNumber: номера бывают
 * дробными, с пропусками и сквозными по томам.
 */
export const BookmarkProgressSchema = z.object({
  chapterNumber: z.number().nullable(),
  position: z.number().int().min(0).nullable(),
  total: z.number().int().min(0).nullable(),
});
export type BookmarkProgress = z.infer<typeof BookmarkProgressSchema>;

/** Карточка на /bookmarks — одна на группу подтверждённых совпадений. */
export const BookmarkItemSchema = z.object({
  /** Title.id цели клика: источник свежей отметки чтения, без неё — где добавили. */
  titleId: z.string(),
  sourceId: z.string(),
  /** Снимок названия, обложки, рейтинга и типа — карточка рисуется и без живого источника. */
  name: z.string(),
  coverUrl: z.string(), // уже проксированный /api/v1/img?...
  contentRating: ContentRatingSchema,
  type: TitleTypeSchema.nullable(),
  folderId: z.string().uuid(),
  /** null — в группе не читали. */
  progress: BookmarkProgressSchema.nullable(),
  /** Сколько глав в ветке цели — когда отметки нет; null — тайтл ещё не проверяли. */
  chaptersCount: z.number().int().min(0).nullable(),
  /** Карточка показывает только признак > 0; число нужно сортировке. */
  newChaptersCount: z.number().int().min(0),
  /** Номер последней главы в ветке цели; null — тайтл ещё не проверяли или у глав нет номеров. */
  latestChapterNumber: z.number().nullable(),
  /** Когда впервые увидели самую свежую из новых глав; null — новых нет. */
  latestNewAt: z.string().datetime().nullable(),
  /** Остальные источники группы — без цели клика. */
  otherSources: z.array(BookmarkSourceSchema),
  availability: BookmarkAvailabilitySchema,
});
export type BookmarkItem = z.infer<typeof BookmarkItemSchema>;

export const BookmarksResponseSchema = z.object({
  items: z.array(BookmarkItemSchema),
  page: z.number(),
  total: z.number(),
});
export type BookmarksResponse = z.infer<typeof BookmarksResponseSchema>;

/** Сколько закладок в «Новых главах в закладках» на главной. */
export const NEW_CHAPTER_BOOKMARKS_LIMIT = 8;

/** Закладки отслеживаемых папок с вышедшими главами — свежая глава первой. */
export const NewChapterBookmarksResponseSchema = z.object({
  items: z.array(BookmarkItemSchema),
});
export type NewChapterBookmarksResponse = z.infer<typeof NewChapterBookmarksResponseSchema>;

/** Сколько тайтлов в одном запросе меток — длинный каталог клиент шлёт частями. */
export const BOOKMARKS_LOOKUP_MAX_TITLES = 1000;

/** Тайтлы, для которых нужны метки «в закладках» на карточках каталога и поиска. */
export const BookmarksLookupRequestSchema = z.object({
  titleIds: z.array(z.string().min(1)).max(BOOKMARKS_LOOKUP_MAX_TITLES),
});
export type BookmarksLookupRequest = z.infer<typeof BookmarksLookupRequestSchema>;

/** titleId → folderId; тайтлов не в закладках в ответе нет. */
export const BookmarksLookupResponseSchema = z.record(z.string(), z.string().uuid());
export type BookmarksLookupResponse = z.infer<typeof BookmarksLookupResponseSchema>;

/** Строка закладки как есть — её возвращает удаление, а «Вернуть» отправляет обратно. */
export const BookmarkRowSchema = z.object({
  titleKey: z.string().min(1),
  sourceId: z.string().min(1),
  titleId: z.string().min(1),
  folderId: z.string().uuid(),
  name: z.string(),
  coverUrl: z.string().nullable(), // адрес на источнике, без подписи прокси
  contentRating: ContentRatingSchema,
  type: TitleTypeSchema.nullable(),
  visitedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type BookmarkRow = z.infer<typeof BookmarkRowSchema>;

export const RestoreBookmarksRequestSchema = z.object({
  rows: z.array(BookmarkRowSchema).min(1).max(64),
});
export type RestoreBookmarksRequest = z.infer<typeof RestoreBookmarksRequestSchema>;

export const RemoveTitleBookmarkResponseSchema = z.object({
  rows: z.array(BookmarkRowSchema),
});
export type RemoveTitleBookmarkResponse = z.infer<typeof RemoveTitleBookmarkResponseSchema>;

/** Одна из папок, по которым разошлись копии группы, и источники, что в ней лежат. */
export const BookmarkFolderCopySchema = z.object({
  folderId: z.string().uuid(),
  sourceIds: z.array(z.string()),
});
export type BookmarkFolderCopy = z.infer<typeof BookmarkFolderCopySchema>;

export const TitleBookmarkSchema = z.object({
  /** Папка группы; null — не в закладках. При конфликте — папка самой свежей строки. */
  folderId: z.string().uuid().nullable(),
  /**
   * Копии группы лежат в разных папках: связь подтвердили, когда обе уже были в закладках. null —
   * конфликта нет. Решается выбором папки — PUT закладки переносит всю группу.
   */
  conflict: z.array(BookmarkFolderCopySchema).nullable(),
});
export type TitleBookmark = z.infer<typeof TitleBookmarkSchema>;

export const SetTitleBookmarkRequestSchema = z.object({
  folderId: z.string().uuid(),
});
export type SetTitleBookmarkRequest = z.infer<typeof SetTitleBookmarkRequestSchema>;

export const TitleBookmarkVisitResponseSchema = z.object({
  /** Chapter.id глав этого тайтла, вышедших с прошлого визита, — до его обнуления. */
  newChapterIds: z.array(z.string()),
});
export type TitleBookmarkVisitResponse = z.infer<typeof TitleBookmarkVisitResponseSchema>;

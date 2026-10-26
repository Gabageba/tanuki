import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';
import {
  BookmarkFolderColorSchema,
  BookmarkFolderIconSchema,
  BuiltInBookmarkFolderSchema,
} from './bookmark';
import { RestoreFolderPolicySchema, RestoreProgressPolicySchema } from './backup';

/** Как папка сайта ложится в наши папки. */
export const SOURCE_IMPORT_FOLDER_TARGET = {
  /** Стандартный статус сайта — встроенная папка. */
  BUILT_IN: 'builtIn',
  /** Своя папка сайта совпала по имени с вашей. */
  MATCHED: 'matched',
  /** Своя папка сайта — создастся такая же. */
  CREATED: 'created',
  /** Своих папок больше лимита — тайтлы лягут во «В планах». */
  OVER_LIMIT: 'overLimit',
} as const;
export type SourceImportFolderTarget = EnumLiteralsOf<typeof SOURCE_IMPORT_FOLDER_TARGET>;
export const SourceImportFolderTargetSchema = z.enum(SOURCE_IMPORT_FOLDER_TARGET);

/** Состояние строки ожидания отметки «где остановился» — нужен серверу и тестам. */
export const SOURCE_IMPORT_PROGRESS_STATUS = {
  PENDING: 'pending',
  /** Сайт не принял сессию — ждём повторного входа. */
  WAITING_RELOGIN: 'waitingRelogin',
  DONE: 'done',
  /** Глава не нашлась, попытки кончились или вход так и не повторили. */
  SKIPPED: 'skipped',
} as const;
export type SourceImportProgressStatus = EnumLiteralsOf<typeof SOURCE_IMPORT_PROGRESS_STATUS>;

export const SourceImportPreviewRequestSchema = z.object({
  sourceId: z.string().min(1),
});
export type SourceImportPreviewRequest = z.infer<typeof SourceImportPreviewRequestSchema>;

const CountSchema = z.number().int().min(0);

/** Папка сайта на шаге «Папки»: куда ляжет и сколько, без списка тайтлов. */
export const SourceImportFolderSchema = z.object({
  /** id папки на сайте — по нему её выбирают в запросе импорта. */
  id: z.string(),
  name: z.string(),
  target: SourceImportFolderTargetSchema,
  /** Наша папка, куда лягут тайтлы: у той, что создастся, — иконка и цвет по умолчанию. */
  targetFolder: z.object({
    builtIn: BuiltInBookmarkFolderSchema.nullable(),
    name: z.string().nullable(),
    icon: BookmarkFolderIconSchema.nullable(),
    color: BookmarkFolderColorSchema.nullable(),
  }),
  total: CountSchema,
  /** Сколько ляжет: уже импортированное в ту же папку не в счёт. */
  fresh: CountSchema,
  /** Из нового — уже в закладках, но в другой папке: об этом вопрос. */
  otherFolder: CountSchema,
  /** Из нового — «где остановился» расходится с вашей отметкой: об этом вопрос. */
  progressDiffers: CountSchema,
});
export type SourceImportFolder = z.infer<typeof SourceImportFolderSchema>;

/** Что нашлось в закладках на сайте. Ничего не записано. */
export const SourceImportPreviewSchema = z.object({
  sourceId: z.string(),
  folders: z.array(SourceImportFolderSchema),
});
export type SourceImportPreview = z.infer<typeof SourceImportPreviewSchema>;

export const SourceImportRequestSchema = z.object({
  sourceId: z.string().min(1),
  folderIds: z.array(z.string()).min(1),
  folderPolicy: RestoreFolderPolicySchema,
  progressPolicy: RestoreProgressPolicySchema,
});
export type SourceImportRequest = z.infer<typeof SourceImportRequestSchema>;

/** Что импорт записал — шаг «Готово». Отметки достраиваются позже, в фоне. */
export const SourceImportResultSchema = z.object({
  sourceId: z.string(),
  bookmarksAdded: CountSchema,
  /** Тайтлов, что уже были в закладках, — сайт добавился к ним ещё одним источником. */
  bookmarksAsSource: CountSchema,
  /** Тайтлов, переехавших в папки, как на сайте. */
  bookmarksMoved: CountSchema,
  /** Из добавленных и переехавших — сколько легло во «В планах», потому что их папка не поместилась. */
  titlesToPlanned: CountSchema,
  foldersCreated: CountSchema,
  foldersMatched: CountSchema,
  foldersOverLimit: CountSchema,
  /** Сколько отметок «где остановился» ждут переноса в фоне. */
  pendingProgress: CountSchema,
});
export type SourceImportResult = z.infer<typeof SourceImportResultSchema>;

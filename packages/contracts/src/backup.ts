import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';
import {
  BookmarkFolderColorSchema,
  BookmarkFolderIconSchema,
  BookmarkFolderNameSchema,
  BuiltInBookmarkFolderSchema,
} from './bookmark';
import { ReaderSettingsSchema } from './reader-settings';
import { ContentRatingSchema, TitleTypeSchema } from './title';
import { UserSettingsSchema } from './user-settings';

/** Метка файла: по ней клиент и сервер отличают резервную копию tanuki от любого другого JSON. */
export const BACKUP_FORMAT = 'tanuki-backup';
/** Версия формата. Копию новее поддерживаемой не разбирают — в ней могут быть незнакомые поля. */
export const BACKUP_VERSION = 1;
/** Больше файл не принимается ни клиентом, ни сервером. */
export const BACKUP_MAX_BYTES = 20 * 1024 * 1024;

/** Чья папка побеждает у тайтла, что уже в закладках в другой папке. */
export const RESTORE_FOLDER_POLICY = {
  KEEP_MINE: 'keepMine',
  FROM_BACKUP: 'fromBackup',
} as const;
export type RestoreFolderPolicy = EnumLiteralsOf<typeof RESTORE_FOLDER_POLICY>;
export const RestoreFolderPolicySchema = z.enum(RESTORE_FOLDER_POLICY);

/** Чья отметка «где остановился» побеждает при расхождении. */
export const RESTORE_PROGRESS_POLICY = {
  /** Та, что дальше по главам. */
  FURTHEST: 'furthest',
  KEEP_MINE: 'keepMine',
  FROM_BACKUP: 'fromBackup',
} as const;
export type RestoreProgressPolicy = EnumLiteralsOf<typeof RESTORE_PROGRESS_POLICY>;
export const RestoreProgressPolicySchema = z.enum(RESTORE_PROGRESS_POLICY);

const DateTimeSchema = z.string().datetime();

/** Начало файла — по нему видно, копия ли это и какой версии, до разбора остального. */
export const BackupHeaderSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
});
export type BackupHeader = z.infer<typeof BackupHeaderSchema>;

/** Общие настройки без подтверждения возраста: из чужого файла оно обходило бы вопрос «вам есть 18?». */
export const BackupUserSettingsSchema = UserSettingsSchema.omit({ ageConfirmed: true });
export type BackupUserSettings = z.infer<typeof BackupUserSettingsSchema>;

export const BackupSettingsSchema = z.object({
  user: BackupUserSettingsSchema,
  /** Порядок источников; null — не задавали, источники идут как в каталоге. */
  sourceOrder: z.array(z.string()).nullable(),
  /** null — читалку не настраивали, действуют умолчания. */
  reader: ReaderSettingsSchema.nullable(),
  disabledSources: z.array(z.string()),
});
export type BackupSettings = z.infer<typeof BackupSettingsSchema>;

export const BackupFolderSchema = z
  .object({
    /** id папки на исходном инстансе — связывает с ней закладки внутри файла. */
    key: z.string().min(1),
    builtIn: BuiltInBookmarkFolderSchema.nullable(),
    name: BookmarkFolderNameSchema.nullable(),
    icon: BookmarkFolderIconSchema.nullable(),
    color: BookmarkFolderColorSchema.nullable(),
    trackUpdates: z.boolean(),
    position: z.number().int(),
  })
  .refine(
    (folder) =>
      folder.builtIn !== null ||
      (folder.name !== null && folder.icon !== null && folder.color !== null),
  );
export type BackupFolder = z.infer<typeof BackupFolderSchema>;

/** Закладка: источник и ключ тайтла сервер выводит из titleId сам. */
export const BackupBookmarkSchema = z.object({
  titleId: z.string().min(1),
  folderKey: z.string().min(1),
  name: z.string(),
  coverUrl: z.string().nullable(),
  contentRating: ContentRatingSchema,
  type: TitleTypeSchema.nullable(),
  visitedAt: DateTimeSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type BackupBookmark = z.infer<typeof BackupBookmarkSchema>;

/** Ключ тайтла начинается с его источника — `linkKeyOf(sourceId, url)`. */
const isKeyOfSource = (row: { titleKey: string; sourceId: string }) =>
  row.titleKey.startsWith(`${row.sourceId}:`);

export const BackupProgressSchema = z
  .object({
    titleKey: z.string().min(1),
    sourceId: z.string().min(1),
    chapterId: z.string().min(1),
    chapterVolume: z.number().nullable(),
    chapterNumber: z.number().nullable(),
    chapterTitle: z.string().nullable(),
    branchId: z.string().min(1),
    pageIndex: z.number().int().min(0),
    titleId: z.string().nullable(),
    titleName: z.string().nullable(),
    coverUrl: z.string().nullable(),
    contentRating: ContentRatingSchema.nullable(),
    type: TitleTypeSchema.nullable(),
    hiddenAt: DateTimeSchema.nullable(),
    updatedAt: DateTimeSchema,
  })
  .refine(isKeyOfSource);
export type BackupProgress = z.infer<typeof BackupProgressSchema>;

export const BackupChapterReadSchema = z
  .object({
    chapterId: z.string().min(1),
    sourceId: z.string().min(1),
    titleKey: z.string().min(1),
    chapterVolume: z.number().nullable(),
    chapterNumber: z.number().nullable(),
    tags: z.array(z.string()),
    readAt: DateTimeSchema,
  })
  .refine(isKeyOfSource);
export type BackupChapterRead = z.infer<typeof BackupChapterReadSchema>;

export const BackupReadingActivitySchema = z.object({
  minute: DateTimeSchema,
  seconds: z.number().int().min(0).max(60),
});
export type BackupReadingActivity = z.infer<typeof BackupReadingActivitySchema>;

/** Резервная копия библиотеки и настроек — файл, который скачивает GET /backup. */
export const BackupSchema = BackupHeaderSchema.extend({
  exportedAt: DateTimeSchema,
  /** Адрес инстанса, где сделана копия. */
  origin: z.string(),
  username: z.string(),
  settings: BackupSettingsSchema,
  folders: z.array(BackupFolderSchema),
  bookmarks: z.array(BackupBookmarkSchema),
  progress: z.array(BackupProgressSchema),
  chapterReads: z.array(BackupChapterReadSchema),
  readingActivity: z.array(BackupReadingActivitySchema),
});
export type Backup = z.infer<typeof BackupSchema>;

export const BackupPreviewRequestSchema = z.object({
  backup: BackupSchema,
});
export type BackupPreviewRequest = z.infer<typeof BackupPreviewRequestSchema>;

const CountSchema = z.number().int().min(0);

/** Что ляжет из копии в библиотеку — шаг «Сводка». Ничего не записано. */
export const BackupPreviewSchema = z.object({
  username: z.string(),
  exportedAt: DateTimeSchema,
  origin: z.string(),
  bookmarks: z.object({
    /** Тайтлов, которых в закладках нет. */
    added: CountSchema,
    /** Уже в закладках в той же папке. */
    sameFolder: CountSchema,
    /** Уже в закладках, но в другой папке, — об этом вопрос. */
    otherFolder: CountSchema,
    /** Источника нет на этом инстансе. */
    skipped: CountSchema,
  }),
  folders: z.object({
    added: CountSchema,
    /** Своя папка с тем же именем уже есть — это она и есть. */
    matched: CountSchema,
    /** Сверх лимита своих папок: их тайтлы лягут во «В планах». */
    overLimit: CountSchema,
  }),
  progress: z.object({
    added: CountSchema,
    /** Отметка есть и с вашей не совпадает — об этом вопрос. */
    differs: CountSchema,
    /** Источника нет на этом инстансе. */
    skipped: CountSchema,
  }),
  chapterReads: z.object({
    /** Глав, которых в статистике ещё нет. */
    added: CountSchema,
    /** Источника нет на этом инстансе. */
    skipped: CountSchema,
  }),
});
export type BackupPreview = z.infer<typeof BackupPreviewSchema>;

export const RestoreBackupRequestSchema = z.object({
  backup: BackupSchema,
  folderPolicy: RestoreFolderPolicySchema,
  progressPolicy: RestoreProgressPolicySchema,
  applySettings: z.boolean(),
});
export type RestoreBackupRequest = z.infer<typeof RestoreBackupRequestSchema>;

/** Что восстановление изменило — шаг «Готово». */
export const BackupRestoreResultSchema = z.object({
  username: z.string(),
  exportedAt: DateTimeSchema,
  bookmarksAdded: CountSchema,
  /** Тайтлов, переехавших в папки из копии. */
  bookmarksMoved: CountSchema,
  /** Из добавленных и переехавших — сколько легло во «В планах», потому что их папка не поместилась. */
  titlesToPlanned: CountSchema,
  foldersCreated: CountSchema,
  foldersOverLimit: CountSchema,
  progressAdded: CountSchema,
  progressUpdated: CountSchema,
  chapterReadsAdded: CountSchema,
  settingsApplied: z.boolean(),
  /** Пропущено: источников нет на этом инстансе. */
  skipped: z.object({
    bookmarks: CountSchema,
    progress: CountSchema,
    chapterReads: CountSchema,
  }),
});
export type BackupRestoreResult = z.infer<typeof BackupRestoreResultSchema>;

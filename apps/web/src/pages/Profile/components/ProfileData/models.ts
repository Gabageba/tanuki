import {
  BUILT_IN_BOOKMARK_FOLDER,
  type BuiltInBookmarkFolder,
  type EnumLiteralsOf,
} from '@tanuki/contracts';

export const EXPORT_FORMAT = {
  JSON: 'json',
  CSV: 'csv',
} as const;
export type ExportFormat = EnumLiteralsOf<typeof EXPORT_FORMAT>;

/** Что «нашлось» в выбранном файле — сам файл не читается: импорт закладок — отдельный план. */
export const MOCK_IMPORT_PREVIEW: { status: BuiltInBookmarkFolder; count: number }[] = [
  { status: BUILT_IN_BOOKMARK_FOLDER.PLANNED, count: 90 },
  { status: BUILT_IN_BOOKMARK_FOLDER.COMPLETED, count: 38 },
  { status: BUILT_IN_BOOKMARK_FOLDER.READING, count: 12 },
  { status: BUILT_IN_BOOKMARK_FOLDER.DROPPED, count: 8 },
];

/** Кеш офлайн-глав из docs/06-pwa-offline.md — «очистка кеша» его не трогает, у него своя кнопка. */
export const OFFLINE_CACHE_NAME = 'tanuki-offline-v1';

import type { EnumLiteralsOf } from '@tanuki/contracts';

export const EXPORT_FORMAT = {
  JSON: 'json',
  CSV: 'csv',
} as const;
export type ExportFormat = EnumLiteralsOf<typeof EXPORT_FORMAT>;

/** Статусы закладок из превью импорта — пока закладок нет, это заглушка для макета. */
export const MOCK_BOOKMARK_STATUS = {
  READING: 'reading',
  PLANNED: 'planned',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const;
export type MockBookmarkStatus = EnumLiteralsOf<typeof MOCK_BOOKMARK_STATUS>;

/** Что «нашлось» в выбранном файле — сам файл не читается, пока нет закладок на сервере. */
export const MOCK_IMPORT_PREVIEW: { status: MockBookmarkStatus; count: number }[] = [
  { status: MOCK_BOOKMARK_STATUS.PLANNED, count: 90 },
  { status: MOCK_BOOKMARK_STATUS.COMPLETED, count: 38 },
  { status: MOCK_BOOKMARK_STATUS.READING, count: 12 },
  { status: MOCK_BOOKMARK_STATUS.DROPPED, count: 8 },
];

/** Кеш офлайн-глав из docs/06-pwa-offline.md — «очистка кеша» его не трогает, у него своя кнопка. */
export const OFFLINE_CACHE_NAME = 'tanuki-offline-v1';

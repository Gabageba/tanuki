import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Что ставить в очередь из ветки. */
export const DOWNLOAD_SCOPE = {
  ALL: 'all',
  UNREAD: 'unread',
  RANGE: 'range',
} as const;
export type DownloadScope = EnumLiteralsOf<typeof DOWNLOAD_SCOPE>;

export type DownloadChaptersFormValues = {
  scope: DownloadScope;
  /** Номера глав в нумерации ветки; пусто — ещё не ввели. */
  from: number | '';
  to: number | '';
};

/** Объём главы, пока ничего не скачано и среднего взять не из чего. */
export const FALLBACK_CHAPTER_BYTES = 20 * 1024 * 1024;

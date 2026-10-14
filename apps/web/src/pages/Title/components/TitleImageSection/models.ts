import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Что показывает карточка загрузок тайтла (B3). */
export const TITLE_DOWNLOADS_STATE = {
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  FAILED: 'failed',
  DONE: 'done',
} as const;
export type TitleDownloadsState = EnumLiteralsOf<typeof TITLE_DOWNLOADS_STATE>;

export type TitleDownloadsSummary = {
  state: TitleDownloadsState;
  /** Все главы тайтла в очереди и скачанном. */
  total: number;
  done: number;
  failed: number;
  bytes: number;
  /** Доля скачанного с учётом страниц текущей главы, 0–100. */
  progress: number;
};

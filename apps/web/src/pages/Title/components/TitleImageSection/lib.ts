import type { TFunction } from 'i18next';
import { DOWNLOAD_STATUS, type DownloadRow } from '@/entities/download/models';
import { DOWNLOADS_TABS, getDownloadsPath } from '@/shared/lib/routes';
import {
  TITLE_DOWNLOADS_STATE,
  type TitleDownloadsState,
  type TitleDownloadsSummary,
} from './models';

const getState = (rows: DownloadRow[], isPaused: boolean): TitleDownloadsState | null => {
  const isActive = rows.some(
    (row) => row.status === DOWNLOAD_STATUS.QUEUED || row.status === DOWNLOAD_STATUS.DOWNLOADING,
  );
  if (isActive) return isPaused ? TITLE_DOWNLOADS_STATE.PAUSED : TITLE_DOWNLOADS_STATE.DOWNLOADING;
  if (rows.some((row) => row.status === DOWNLOAD_STATUS.FAILED))
    return TITLE_DOWNLOADS_STATE.FAILED;
  if (rows.some((row) => row.status === DOWNLOAD_STATUS.DONE)) return TITLE_DOWNLOADS_STATE.DONE;
  return null;
};

/** Загрузки тайтла одной сводкой; ничего не скачано и не в очереди — null, карточки нет. */
export const getTitleDownloadsSummary = (
  rows: DownloadRow[],
  isPaused: boolean,
): TitleDownloadsSummary | null => {
  const state = getState(rows, isPaused);
  if (!state) return null;

  const done = rows.filter((row) => row.status === DOWNLOAD_STATUS.DONE).length;
  const current = rows.find((row) => row.status === DOWNLOAD_STATUS.DOWNLOADING);
  const currentShare =
    current && current.pagesTotal > 0 ? current.pagesDone / current.pagesTotal : 0;

  return {
    state,
    total: rows.length,
    done,
    failed: rows.filter((row) => row.status === DOWNLOAD_STATUS.FAILED).length,
    bytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    progress: ((done + currentShare) / rows.length) * 100,
  };
};

export const getTitleDownloadsPhrase = (summary: TitleDownloadsSummary, t: TFunction) => {
  switch (summary.state) {
    case TITLE_DOWNLOADS_STATE.DOWNLOADING:
      return t('downloadingCountOfTotal', { done: summary.done, total: summary.total });
    case TITLE_DOWNLOADS_STATE.PAUSED:
      return t('downloadsPausedCountOfTotal', { done: summary.done, total: summary.total });
    case TITLE_DOWNLOADS_STATE.FAILED:
      return t('failedToDownloadChaptersAbbrev', { count: summary.failed });
    case TITLE_DOWNLOADS_STATE.DONE:
      return t('downloadedChaptersAbbrev', { count: summary.done });
  }
};

/** Всё скачано — к тайтлу в «Скачанном»; иначе в очередь, где видно, что качается и что упало. */
export const getTitleDownloadsPath = (state: TitleDownloadsState, titleId: string) => {
  switch (state) {
    case TITLE_DOWNLOADS_STATE.DONE:
      return getDownloadsPath(DOWNLOADS_TABS.DOWNLOADED, titleId);
    case TITLE_DOWNLOADS_STATE.DOWNLOADING:
    case TITLE_DOWNLOADS_STATE.PAUSED:
    case TITLE_DOWNLOADS_STATE.FAILED:
      return getDownloadsPath(DOWNLOADS_TABS.QUEUE);
  }
};

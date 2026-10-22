import type { TFunction } from 'i18next';
import {
  DOWNLOAD_ERROR,
  DOWNLOAD_STATUS,
  OFFLINE_CACHE_NAME,
  OFFLINE_PATH_PREFIX,
  type DownloadError,
  type DownloadRow,
} from './models';

/** Подпись `/img` меняется на каждом ответе, поэтому скачанная страница лежит в кеше не по своему
 *  адресу, а по ключу главы и номера: `/offline/<userId>/<titleId>/<chapterId>/<pageIndex>`. */
export const getOfflineTitlePrefix = (userId: string, titleId: string) =>
  `${OFFLINE_PATH_PREFIX}${encodeURIComponent(userId)}/${encodeURIComponent(titleId)}/`;

export const getOfflineChapterPrefix = (userId: string, titleId: string, chapterId: string) =>
  `${getOfflineTitlePrefix(userId, titleId)}${encodeURIComponent(chapterId)}/`;

export const getOfflinePageKey = (
  userId: string,
  titleId: string,
  chapterId: string,
  pageIndex: number,
) => `${getOfflineChapterPrefix(userId, titleId, chapterId)}${pageIndex}`;

export const getOfflineCoverKey = (userId: string, titleId: string) =>
  `${getOfflineTitlePrefix(userId, titleId)}cover`;

export const getOfflineUserPrefix = (userId: string) =>
  `${OFFLINE_PATH_PREFIX}${encodeURIComponent(userId)}/`;

/** Удаляет из кеша скачанного всё, что лежит под ключом-префиксом. В Cache API удаления по
 *  префиксу нет — перебираем ключи. */
export const deleteOfflineCacheByPrefix = async (prefix: string) => {
  if (typeof caches === 'undefined') return;
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  const keys = await cache.keys();
  await Promise.all(
    keys
      .filter((request) => new URL(request.url).pathname.startsWith(prefix))
      .map((request) => cache.delete(request)),
  );
};

export const isQuotaExceededError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

export const getDownloadErrorLabel = (error: DownloadError, t: TFunction) => {
  switch (error) {
    case DOWNLOAD_ERROR.NETWORK:
      return t('downloadFailedConnectionDropped');
    case DOWNLOAD_ERROR.SOURCE:
      return t('sourceDidNotReturnPages');
    case DOWNLOAD_ERROR.QUOTA:
      return t('deviceOutOfSpace');
  }
};

export const isDownloadDone = (row: DownloadRow | undefined) =>
  row?.status === DOWNLOAD_STATUS.DONE;

/** Главы списка, которые без сети не открыть: не скачаны до конца. */
export const getUnavailableChapterIds = (
  chapters: { id: string }[],
  downloads: ReadonlyMap<string, DownloadRow> | undefined,
): ReadonlySet<string> =>
  new Set(
    chapters
      .filter((chapter) => !isDownloadDone(downloads?.get(chapter.id)))
      .map((chapter) => chapter.id),
  );

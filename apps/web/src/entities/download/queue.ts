import {
  DEFAULT_BRANCH_ID,
  type Chapter,
  type ChapterNumbering,
  type ChaptersResponse,
  type TitleDetailsResponse,
} from '@tanuki/contracts';
import { postServiceWorkerMessage } from '@/shared/lib/serviceWorker';
import { toServerDateTime } from '@/shared/lib/serverDateTime';
import { getOfflineDb } from './db';
import {
  deleteOfflineCacheByPrefix,
  getOfflineChapterPrefix,
  getOfflineTitlePrefix,
  getOfflineUserPrefix,
} from './lib';
import {
  DOWNLOAD_ERROR,
  DOWNLOAD_MESSAGE,
  DOWNLOAD_STATUS,
  QUEUE_STATE_ID,
  type DownloadRow,
} from './models';

/** Скачивать можно, только если есть service worker, IndexedDB и Cache API. В приватном окне
 *  чего-то из этого может не быть. */
export const isDownloadSupported = () =>
  'serviceWorker' in navigator && 'indexedDB' in window && 'caches' in window;

/** Разбудить воркер: пройти очередь пользователя. Безвредно, если она уже идёт. */
export const processDownloadQueue = (userId: string) =>
  postServiceWorkerMessage({ type: DOWNLOAD_MESSAGE.PROCESS, userId });

const abortDownload = (userId: string, chapterId: string) =>
  postServiceWorkerMessage({ type: DOWNLOAD_MESSAGE.ABORT, userId, chapterId });

/** Просим браузер не вытеснять скачанное. Ответ ни на что не влияет: без защиты всё работает, только
 *  браузер вправе почистить данные при нехватке места. */
const requestPersistentStorage = async () => {
  if (!navigator.storage?.persist) return;
  try {
    if (!(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Safari без установки может отказать исключением — это тот же отказ.
  }
};

type EnqueueParams = {
  userId: string;
  details: TitleDetailsResponse;
  /** Главы в порядке чтения — от старых к новым: в том же порядке они встают в очередь. */
  chapters: Chapter[];
  numbering: ChapterNumbering;
  /** Список глав ветки, из которой ставим, и ключ его запроса — для снимка тайтла. */
  chaptersList: ChaptersResponse;
  chaptersListKey: string;
};

/**
 * Ставит главы в конец очереди одной транзакцией (и тысяча глав встаёт разом). Скачанные и уже
 * стоящие в очереди пропускаются. Заодно сохраняет снимок тайтла и глав — по нему страница тайтла и
 * читалка работают без сети. Возвращает, сколько глав встало.
 */
export const enqueueChapters = async ({
  userId,
  details,
  chapters,
  numbering,
  chaptersList,
  chaptersListKey,
}: EnqueueParams) => {
  const db = getOfflineDb(userId);
  const titleId = details.title.id;

  const added = await db.transaction(
    'rw',
    [db.downloads, db.chapters, db.titles, db.skipped],
    async () => {
      const existing = await db.downloads.bulkGet(chapters.map((chapter) => chapter.id));
      const fresh = chapters.filter((_, index) => !existing[index]);
      const last = await db.downloads.orderBy('order').last();
      let order = (last?.order ?? 0) + 1;
      const createdAt = toServerDateTime(new Date());

      const rows: DownloadRow[] = fresh.map((chapter) => ({
        chapterId: chapter.id,
        titleId,
        branchId: chapter.branch ?? DEFAULT_BRANCH_ID,
        status: DOWNLOAD_STATUS.QUEUED,
        order: order++,
        pagesDone: 0,
        pagesTotal: 0,
        bytes: 0,
        createdAt,
      }));
      await db.downloads.bulkAdd(rows);
      await db.chapters.bulkPut(
        fresh.map((chapter) => ({
          chapterId: chapter.id,
          titleId,
          chapter,
          numbering,
          pages: [],
          prevChapterId: null,
          nextChapterId: null,
        })),
      );
      // Поставленную вручную главу авто-удаление больше не помнит удалённой.
      await db.skipped.bulkDelete(fresh.map((chapter) => chapter.id));

      const title = await db.titles.get(titleId);
      await db.titles.put({
        titleId,
        sourceId: details.title.sourceId,
        details,
        chapterLists: { ...title?.chapterLists, [chaptersListKey]: chaptersList },
        coverKey: title?.coverKey ?? null,
        createdAt: title?.createdAt ?? createdAt,
      });
      return rows.length;
    },
  );

  if (added > 0) {
    void requestPersistentStorage();
    processDownloadQueue(userId);
  }
  return added;
};

/** Свежий ответ сервера обновляет снимок тайтла, если у него что-то скачано. */
export const updateTitleSnapshot = async (
  userId: string,
  titleId: string,
  patch: { details?: TitleDetailsResponse; chaptersList?: ChaptersResponse; listKey?: string },
) => {
  const db = getOfflineDb(userId);
  await db.transaction('rw', db.titles, async () => {
    const row = await db.titles.get(titleId);
    if (!row) return;
    await db.titles.update(titleId, {
      details: patch.details ?? row.details,
      chapterLists:
        patch.chaptersList && patch.listKey !== undefined
          ? { ...row.chapterLists, [patch.listKey]: patch.chaptersList }
          : row.chapterLists,
    });
  });
};

/** Удаляет записи глав и их страницы. Тайтл без единой записи уходит вместе с обложкой. */
const removeChapters = async (userId: string, rows: DownloadRow[]) => {
  const db = getOfflineDb(userId);
  const chapterIds = rows.map((row) => row.chapterId);
  const titleIds = [...new Set(rows.map((row) => row.titleId))];

  const emptyTitleIds = await db.transaction(
    'rw',
    [db.downloads, db.chapters, db.titles],
    async () => {
      await db.downloads.bulkDelete(chapterIds);
      await db.chapters.bulkDelete(chapterIds);
      const empty: string[] = [];
      for (const titleId of titleIds) {
        if ((await db.downloads.where('titleId').equals(titleId).count()) === 0) {
          empty.push(titleId);
        }
      }
      await db.titles.bulkDelete(empty);
      return empty;
    },
  );

  rows
    .filter((row) => row.status === DOWNLOAD_STATUS.DOWNLOADING)
    .forEach((row) => abortDownload(userId, row.chapterId));
  await Promise.all([
    ...rows
      .filter((row) => !emptyTitleIds.includes(row.titleId))
      .map((row) =>
        deleteOfflineCacheByPrefix(getOfflineChapterPrefix(userId, row.titleId, row.chapterId)),
      ),
    ...emptyTitleIds.map((titleId) =>
      deleteOfflineCacheByPrefix(getOfflineTitlePrefix(userId, titleId)),
    ),
  ]);
};

/** Отмена загрузки и удаление скачанной главы — одно действие: записи нет, страниц нет. */
export const deleteDownloads = async (userId: string, chapterIds: string[]) => {
  const rows = await getOfflineDb(userId).downloads.bulkGet(chapterIds);
  await removeChapters(
    userId,
    rows.filter((row): row is DownloadRow => row !== undefined),
  );
};

export const deleteTitleDownloads = async (userId: string, titleId: string) => {
  const rows = await getOfflineDb(userId).downloads.where('titleId').equals(titleId).toArray();
  await removeChapters(userId, rows);
};

/** Всё скачанное и вся очередь. Настройки и висящие отметки прогресса остаются. */
export const deleteAllDownloads = async (userId: string) => {
  const db = getOfflineDb(userId);
  const current = await db.downloads.where('status').equals(DOWNLOAD_STATUS.DOWNLOADING).toArray();
  await db.transaction('rw', [db.downloads, db.chapters, db.titles], async () => {
    await db.downloads.clear();
    await db.chapters.clear();
    await db.titles.clear();
  });
  current.forEach((row) => abortDownload(userId, row.chapterId));
  await deleteOfflineCacheByPrefix(getOfflineUserPrefix(userId));
};

/** Упавшая глава встаёт обратно в очередь на своё место; уже скачанные страницы не перекачиваются. */
export const retryDownloads = async (userId: string, chapterIds: string[]) => {
  const db = getOfflineDb(userId);
  await db.downloads
    .where('chapterId')
    .anyOf(chapterIds)
    .and((row) => row.status === DOWNLOAD_STATUS.FAILED)
    .modify({ status: DOWNLOAD_STATUS.QUEUED, error: undefined });
  processDownloadQueue(userId);
};

/** Пауза всей очереди переживает перезапуск. Продолжение заодно возвращает в очередь главы, упавшие
 *  из-за места: пользователь освободил его и нажал «Продолжить». */
export const setDownloadsPaused = async (userId: string, isPaused: boolean) => {
  const db = getOfflineDb(userId);
  await db.transaction('rw', [db.queue, db.downloads], async () => {
    await db.queue.put({ id: QUEUE_STATE_ID, isPaused });
    if (isPaused) return;
    await db.downloads
      .where('status')
      .equals(DOWNLOAD_STATUS.FAILED)
      .and((row) => row.error === DOWNLOAD_ERROR.QUOTA)
      .modify({ status: DOWNLOAD_STATUS.QUEUED, error: undefined });
  });
  if (!isPaused) processDownloadQueue(userId);
};

/** Новый порядок очереди — id глав сверху вниз. */
export const reorderDownloads = async (userId: string, chapterIds: string[]) => {
  const db = getOfflineDb(userId);
  await db.transaction('rw', db.downloads, async () => {
    await Promise.all(
      chapterIds.map((chapterId, index) => db.downloads.update(chapterId, { order: index + 1 })),
    );
  });
};

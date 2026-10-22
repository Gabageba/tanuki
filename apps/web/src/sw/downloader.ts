/// <reference lib="webworker" />
import type { EnumLiteralsOf, PagesResponse } from '@tanuki/contracts';
import { getOfflineDb, type OfflineDb } from '../entities/download/db';
import {
  deleteOfflineCacheByPrefix,
  getOfflineChapterPrefix,
  getOfflineCoverKey,
  getOfflinePageKey,
  isQuotaExceededError,
} from '../entities/download/lib';
import {
  DOWNLOAD_ERROR,
  DOWNLOAD_STATUS,
  OFFLINE_CACHE_NAME,
  OFFLINE_REQUEST_HEADER,
  PAGE_RETRY_DELAYS_MS,
  QUEUE_STATE_ID,
  type DownloadError,
  type DownloadRow,
} from '../entities/download/models';
import { toServerDateTime } from '../shared/lib/serverDateTime';

declare const self: ServiceWorkerGlobalScope;

/** Почему очередь остановилась на главе — от этого зависит, что станет с её записью. */
const STOP_REASON = {
  /** Сеть пропала: глава ждёт и продолжится с той же страницы, когда страница разбудит очередь. */
  OFFLINE: 'offline',
  /** Сессии нет: качать нечем, очередь ждёт входа. */
  UNAUTHORIZED: 'unauthorized',
  /** Главу отменили или удалили посреди загрузки. */
  ABORTED: 'aborted',
  /** Пауза всей очереди: текущая глава остаётся текущей. */
  PAUSED: 'paused',
} as const;
type StopReason = EnumLiteralsOf<typeof STOP_REASON>;

class StopError extends Error {
  constructor(public readonly reason: StopReason) {
    super(reason);
  }
}

class ChapterFailedError extends Error {
  constructor(public readonly code: DownloadError) {
    super(code);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Очередь пользователя, которая идёт прямо сейчас, — повторный запуск получает её же. */
const running = new Map<string, Promise<void>>();
/** Чью очередь качаем. Другой пользователь вошёл в том же браузере — чужая очередь встаёт. */
let activeUserId: string | null = null;
/** Загрузка текущей главы — её обрывает отмена. */
let current: { userId: string; chapterId: string; controller: AbortController } | null = null;

export const abortChapterDownload = (userId: string, chapterId: string) => {
  if (current && current.userId === userId && current.chapterId === chapterId) {
    current.controller.abort();
  }
};

const isOffline = () => !self.navigator.onLine;

/**
 * Запрос с повторами: до трёх попыток с паузами 1, 3 и 9 с. Без сети не повторяем — глава ждёт.
 * 401 — сессии нет; 403 отдаётся как есть: им `/img` отвечает на истёкшую подпись, и вызывающий
 * перезапросит `/pages`. Остальные ошибки ответа — сбой источника.
 */
const fetchWithRetries = async (url: string, signal: AbortSignal) => {
  let lastError: DownloadError = DOWNLOAD_ERROR.NETWORK;
  for (let attempt = 0; attempt <= PAGE_RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(PAGE_RETRY_DELAYS_MS[attempt - 1] ?? 0);
    if (signal.aborted) throw new StopError(STOP_REASON.ABORTED);
    if (isOffline()) throw new StopError(STOP_REASON.OFFLINE);
    try {
      const response = await fetch(url, {
        headers: { [OFFLINE_REQUEST_HEADER]: '1' },
        credentials: 'same-origin',
        signal,
      });
      if (response.ok || response.status === 403) return response;
      if (response.status === 401) throw new StopError(STOP_REASON.UNAUTHORIZED);
      lastError = DOWNLOAD_ERROR.SOURCE;
    } catch (error) {
      if (error instanceof StopError) throw error;
      if (signal.aborted) throw new StopError(STOP_REASON.ABORTED);
      if (isOffline()) throw new StopError(STOP_REASON.OFFLINE);
      lastError = DOWNLOAD_ERROR.NETWORK;
    }
  }
  throw new ChapterFailedError(lastError);
};

/** Тело приходит после заголовков: обрыв сети или отмена посреди него значат то же, что и в самом
 *  запросе, — глава ждёт сети или останавливается, а не падает. */
const readBody = async <T>(read: () => Promise<T>, signal: AbortSignal) => {
  try {
    return await read();
  } catch (error) {
    if (signal.aborted) throw new StopError(STOP_REASON.ABORTED);
    if (isOffline()) throw new StopError(STOP_REASON.OFFLINE);
    throw error;
  }
};

/** Подписанные адреса страниц живут час — берём их прямо перед главой и заново, если истекли. */
const fetchPages = async (row: DownloadRow, signal: AbortSignal) => {
  const response = await fetchWithRetries(
    `/api/v1/titles/${encodeURIComponent(row.titleId)}/chapters/${encodeURIComponent(row.chapterId)}/pages`,
    signal,
  );
  if (!response.ok) throw new ChapterFailedError(DOWNLOAD_ERROR.SOURCE);
  return readBody(() => response.json() as Promise<PagesResponse>, signal);
};

/** Обложка тайтла — для «Загрузок», каталога и страницы тайтла без сети. Не вышло — не беда. */
const saveCover = async (db: OfflineDb, userId: string, titleId: string, signal: AbortSignal) => {
  const title = await db.titles.get(titleId);
  if (!title || title.coverKey) return;
  const coverUrl = title.details.title.largeCoverUrl || title.details.title.coverUrl;
  if (!coverUrl) return;
  try {
    const response = await fetch(coverUrl, { signal });
    if (!response.ok) return;
    const key = getOfflineCoverKey(userId, titleId);
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    await cache.put(key, response);
    await db.titles.update(titleId, { coverKey: key });
  } catch (error) {
    if (isQuotaExceededError(error)) throw error;
  }
};

const ensureNotPaused = async (db: OfflineDb) => {
  const state = await db.queue.get(QUEUE_STATE_ID);
  if (state?.isPaused) throw new StopError(STOP_REASON.PAUSED);
};

/** Качает главу страница за страницей, последовательно — параллельные запросы к источнику кончаются
 *  баном прокси по IP. Страницы, которые уже в кеше, пропускаются: так идёт докачка. */
const downloadChapter = async (
  db: OfflineDb,
  userId: string,
  row: DownloadRow,
  signal: AbortSignal,
) => {
  await db.downloads.update(row.chapterId, { status: DOWNLOAD_STATUS.DOWNLOADING });
  await saveCover(db, userId, row.titleId, signal);

  let pagesResponse = await fetchPages(row, signal);
  const pages = pagesResponse.items;
  await db.chapters.update(row.chapterId, {
    pages,
    prevChapterId: pagesResponse.prevChapterId,
    nextChapterId: pagesResponse.nextChapterId,
  });
  await db.downloads.update(row.chapterId, { pagesTotal: pages.length });

  const cache = await caches.open(OFFLINE_CACHE_NAME);
  let bytes = 0;
  for (let index = 0; index < pages.length; index++) {
    await ensureNotPaused(db);
    if (!(await db.downloads.get(row.chapterId))) throw new StopError(STOP_REASON.ABORTED);

    const key = getOfflinePageKey(userId, row.titleId, row.chapterId, index);
    const cached = await cache.match(key);
    if (cached) {
      bytes += (await cached.blob()).size;
    } else {
      let response = await fetchWithRetries(pagesResponse.items[index]?.url ?? '', signal);
      if (response.status === 403) {
        pagesResponse = await fetchPages(row, signal);
        response = await fetchWithRetries(pagesResponse.items[index]?.url ?? '', signal);
        if (!response.ok) throw new ChapterFailedError(DOWNLOAD_ERROR.SOURCE);
      }
      const blob = await readBody(() => response.blob(), signal);
      bytes += blob.size;
      await cache.put(
        key,
        new Response(blob, {
          headers: { 'content-type': response.headers.get('content-type') ?? blob.type },
        }),
      );
    }
    await db.downloads.update(row.chapterId, { pagesDone: index + 1, bytes });
  }

  await db.downloads.update(row.chapterId, {
    status: DOWNLOAD_STATUS.DONE,
    doneAt: toServerDateTime(new Date()),
  });
};

const getNextRow = async (db: OfflineDb) => {
  const rows = await db.downloads
    .where('status')
    .anyOf(DOWNLOAD_STATUS.QUEUED, DOWNLOAD_STATUS.DOWNLOADING)
    .toArray();
  return rows.sort((a, b) => a.order - b.order)[0];
};

const failChapter = (db: OfflineDb, chapterId: string, error: DownloadError) =>
  db.downloads.update(chapterId, { status: DOWNLOAD_STATUS.FAILED, error });

/** Идёт по очереди, пока есть что качать: одна глава за раз. Останавливается на паузе, без сети и
 *  без сессии — разбудит страница. */
const runQueue = async (userId: string) => {
  const db = getOfflineDb(userId);
  for (;;) {
    if (isOffline() || activeUserId !== userId) return;
    const state = await db.queue.get(QUEUE_STATE_ID);
    if (state?.isPaused) return;
    const row = await getNextRow(db);
    if (!row) return;

    const controller = new AbortController();
    current = { userId, chapterId: row.chapterId, controller };
    try {
      await downloadChapter(db, userId, row, controller.signal);
    } catch (error) {
      if (error instanceof StopError) {
        if (error.reason === STOP_REASON.ABORTED) {
          // Отменённую главу страница уже удалила вместе со страницами, но кеш мог получить
          // страницу после этого. Запись осталась — значит, обрыв из-за смены пользователя.
          if (!(await db.downloads.get(row.chapterId))) {
            await deleteOfflineCacheByPrefix(
              getOfflineChapterPrefix(userId, row.titleId, row.chapterId),
            );
          }
          continue;
        }
        return;
      }
      if (isQuotaExceededError(error)) {
        await failChapter(db, row.chapterId, DOWNLOAD_ERROR.QUOTA);
        await db.queue.put({ id: QUEUE_STATE_ID, isPaused: true });
        return;
      }
      await failChapter(
        db,
        row.chapterId,
        error instanceof ChapterFailedError ? error.code : DOWNLOAD_ERROR.NETWORK,
      );
    } finally {
      current = null;
    }
  }
};

/** Запускает очередь пользователя или возвращает уже идущую. Промис — для `waitUntil`: пока он не
 *  завершился, браузер не останавливает воркер (страница ещё и шлёт пульс, продлевая его жизнь). */
export const processQueue = (userId: string) => {
  activeUserId = userId;
  if (current && current.userId !== userId) current.controller.abort();
  const existing = running.get(userId);
  if (existing) return existing;
  const promise = runQueue(userId)
    .catch(() => undefined)
    .finally(() => running.delete(userId));
  running.set(userId, promise);
  return promise;
};

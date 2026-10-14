import type { Chapter, ReadingProgress, TitleReadingProgressResponse } from '@tanuki/contracts';
import { apiFetch, ApiRequestError, isNetworkError } from '@/shared/api/client';
import { toServerDateTime } from '@/shared/lib/serverDateTime';
import { getOfflineDb } from '@/entities/download/db';
import type { PendingProgressRow } from '@/entities/download/models';
import { toOptimisticProgress } from './readingProgress';

export type ProgressPosition = {
  chapterId: string;
  pageIndex: number;
  /** Глава целиком, если она под рукой: по ней отметка рисуется до ответа сервера. */
  chapter?: Chapter;
};

/** Запрос уходит синхронно, в момент вызова: так его можно слать из pagehide, когда на
 *  промисы мутации (onMutate ждёт cancelQueries) времени уже нет. keepalive не даёт браузеру
 *  оборвать его вместе с закрывающейся вкладкой. */
export const saveReadingProgress = (titleId: string, { chapterId, pageIndex }: ProgressPosition) =>
  apiFetch<ReadingProgress>(`/titles/${titleId}/progress`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chapterId, pageIndex }),
    keepalive: true,
  });

const getPendingTable = (userId: string) => getOfflineDb(userId).pendingProgress;

export const readPendingProgress = async (userId: string, titleId: string) => {
  try {
    return await getPendingTable(userId).get(titleId);
  } catch {
    return undefined;
  }
};

/** Отметка висящей записи так, как её покажет список глав: нужна глава — из записи или из снимка
 *  скачанной главы. */
export const toPendingOwnProgress = async (userId: string, row: PendingProgressRow) => {
  const chapter = row.chapter ?? (await getOfflineDb(userId).chapters.get(row.chapterId))?.chapter;
  return chapter ? toOptimisticProgress(chapter, row.pageIndex) : null;
};

/** Ответ сервера с поправкой на отметку, которая ещё не ушла: она свежее. */
export const applyPendingProgress = async (
  userId: string,
  titleId: string,
  response: TitleReadingProgressResponse,
): Promise<TitleReadingProgressResponse> => {
  const pending = await readPendingProgress(userId, titleId);
  const own = pending ? await toPendingOwnProgress(userId, pending) : null;
  return own ? { ...response, own } : response;
};

/**
 * Отправляет отметку, а без сети ставит её в очередь отправки — одна запись на тайтл, последняя
 * побеждает. Ушедшая отметка заодно снимает висящую: та старше. Возвращает отметку с сервера,
 * а без сети — свою, если по ней есть глава.
 */
export const sendReadingProgress = async (
  userId: string | undefined,
  titleId: string,
  position: ProgressPosition,
): Promise<ReadingProgress | null> => {
  try {
    const progress = await saveReadingProgress(titleId, position);
    if (userId)
      await getPendingTable(userId)
        .delete(titleId)
        .catch(() => undefined);
    return progress;
  } catch (error) {
    if (!userId || !isNetworkError(error)) throw error;
    const row: PendingProgressRow = {
      titleId,
      chapterId: position.chapterId,
      pageIndex: position.pageIndex,
      chapter: position.chapter,
      savedAt: toServerDateTime(new Date()),
    };
    await getPendingTable(userId).put(row);
    return toPendingOwnProgress(userId, row);
  }
};

/** Отправляет висящие отметки, когда появилась сеть. Возвращает тайтлы, чьи отметки ушли. Сеть
 *  снова пропала — остальные ждут следующего раза. */
export const flushPendingProgress = async (userId: string) => {
  let rows: PendingProgressRow[];
  try {
    rows = await getPendingTable(userId).toArray();
  } catch {
    return [];
  }
  const sent: string[] = [];
  for (const row of rows) {
    try {
      await saveReadingProgress(row.titleId, row);
    } catch (error) {
      // Сети нет или сессия истекла — остальные упадут так же, ждём следующего раза.
      if (isNetworkError(error) || (error instanceof ApiRequestError && error.status === 401)) {
        break;
      }
      // Сбой сервера (деплой, 5xx) — отметка остаётся в очереди, остальные идут дальше.
      if (error instanceof ApiRequestError && error.status >= 500) continue;
      // Сервер отказал (главы больше нет) — повтор ответит тем же.
    }
    // Пока отметка летела, могла появиться новая — её не трогаем.
    await getPendingTable(userId)
      .where('titleId')
      .equals(row.titleId)
      .and((current) => current.savedAt === row.savedAt)
      .delete();
    sent.push(row.titleId);
  }
  return sent;
};

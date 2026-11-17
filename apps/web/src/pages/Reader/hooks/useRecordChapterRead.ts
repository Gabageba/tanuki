import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@tanuki/contracts';
import useCurrentUser, { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';
import { apiFetch, ApiRequestError, isNetworkError } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { recordCompletedChapter } from '@/shared/lib/appInstall/install';
import type { ReaderPosition } from '../models';

type Params = {
  titleId: string;
  position: ReaderPosition;
  pagesLength: number | null;
};

type ChapterReadTarget = {
  userId: string;
  titleId: string;
  chapterId: string;
};

/**
 * Отмечает главу прочитанной для статистики, как только читатель дошёл до её последней страницы.
 * Без задержки, в отличие от прогресса: в ленте последнюю страницу проскакивают за секунду. Первое
 * прочтение сервер хранит сам, так что повтор с другого захода безвреден — здесь отсекаются лишь
 * повторы в пределах одного захода в читалку.
 */
function useRecordChapterRead({ titleId, position, pagesLength }: Params) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const recorded = useRef(new Set<string>());
  const { chapterId, pageIndex } = position;
  const { mutate } = useMutation({
    mutationFn: async (target: ChapterReadTarget) => {
      // Отложенный повтор принадлежит тому, кто читал: после смены аккаунта его не отправляем.
      if (queryClient.getQueryData<CurrentUser>(CURRENT_USER_QUERY_KEY)?.id !== target.userId)
        return;
      await apiFetch<void>(`/titles/${target.titleId}/chapter-reads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chapterId: target.chapterId }),
        keepalive: true,
      });
    },
    // Временный сбой не теряет дочитанную главу, даже если читатель уже перешёл дальше.
    // Без сети мутация ждёт восстановления соединения; повторы ограничены задержкой до 30 с.
    retry: (_failureCount, error) =>
      isNetworkError(error) ||
      (error instanceof ApiRequestError && (error.status === 429 || error.status >= 500)),
    meta: SILENT_ERROR_META,
    onError: (_error, target) => recorded.current.delete(target.chapterId),
  });

  useEffect(() => {
    if (!user || pagesLength === null || pageIndex !== pagesLength - 1) return;
    if (recorded.current.has(chapterId)) return;
    recorded.current.add(chapterId);
    recordCompletedChapter(titleId, chapterId);

    mutate({ userId: user.id, titleId, chapterId });
  }, [user, titleId, chapterId, pageIndex, pagesLength, mutate]);
}

export default useRecordChapterRead;

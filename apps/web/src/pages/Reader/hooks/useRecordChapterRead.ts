import { useEffect, useRef } from 'react';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { apiFetch } from '@/shared/api/client';
import type { ReaderPosition } from '../models';

type Params = {
  titleId: string;
  position: ReaderPosition;
  pagesLength: number | null;
};

/**
 * Отмечает главу прочитанной для статистики, как только читатель дошёл до её последней страницы.
 * Без задержки, в отличие от прогресса: в ленте последнюю страницу проскакивают за секунду. Первое
 * прочтение сервер хранит сам, так что повтор с другого захода безвреден — здесь отсекаются лишь
 * повторы в пределах одного захода в читалку.
 */
function useRecordChapterRead({ titleId, position, pagesLength }: Params) {
  const { data: user } = useCurrentUser();
  const recorded = useRef(new Set<string>());
  const { chapterId, pageIndex } = position;

  useEffect(() => {
    if (!user || pagesLength === null || pageIndex !== pagesLength - 1) return;
    if (recorded.current.has(chapterId)) return;
    recorded.current.add(chapterId);

    // keepalive — чтобы запрос пережил закрытие вкладки сразу после последней страницы.
    apiFetch<void>(`/titles/${titleId}/chapter-reads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chapterId }),
      keepalive: true,
    }).catch(() => recorded.current.delete(chapterId));
  }, [user, titleId, chapterId, pageIndex, pagesLength]);
}

export default useRecordChapterRead;

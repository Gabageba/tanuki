import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TitleReadingProgressResponse } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import { getReadingProgressQueryKey } from '@/entities/title/hooks/useReadingProgress';
import useUpdateReadingProgress, {
  saveReadingProgress,
} from '@/entities/title/hooks/useUpdateReadingProgress';
import { toOptimisticProgress } from '@/entities/title/readingProgress';
import { getReaderPageKey } from '../lib';
import type { ReaderPosition } from '../models';

/** Позиция уходит на сервер, только когда читатель задержался на странице, — листание подряд не
 *  превращается в запрос на каждую страницу. */
const SAVE_DELAY_MS = 2000;

type Params = {
  titleId: string;
  position: ReaderPosition;
};

/**
 * Запоминает, где остановились. В кеш позиция пишется сразу — список глав в drawer'е и кнопка
 * «Продолжить» видят её без задержки, — а на сервер уходит с задержкой либо немедленно, если
 * читалку не дождались: ушли на другую страницу приложения, спрятали, закрыли или перезагрузили
 * вкладку.
 */
function useSaveReadingProgress({ titleId, position }: Params) {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateReadingProgress({ titleId, notifyOnError: false });
  // Та же ветка по умолчанию, что и у шапки читалки: запрос уже в кеше.
  const { data: chaptersData } = useChapters({ titleId });

  const pending = useRef<ReaderPosition | null>(null);
  const lastSavedKey = useRef<string | null>(null);

  /** Несохранённая позиция, если она отличается от уже отправленной. */
  const takePending = useCallback(() => {
    const target = pending.current;
    pending.current = null;
    if (!target) return null;

    const key = getReaderPageKey(target);
    if (key === lastSavedKey.current) return null;

    lastSavedKey.current = key;
    return target;
  }, []);

  const flush = useCallback(() => {
    const target = takePending();
    if (target) mutate({ chapterId: target.chapterId, pageIndex: target.pageIndex });
  }, [takePending, mutate]);

  // Страница уходит: мутация стартует запрос только после await в onMutate и может не успеть,
  // поэтому запрос шлётся напрямую, прямо в обработчике. Ответ уже некому принять.
  const flushOnExit = useCallback(() => {
    const target = takePending();
    if (target) saveReadingProgress(titleId, target).catch(() => undefined);
  }, [takePending, titleId]);

  const { chapterId, pageIndex } = position;
  const chapter = chaptersData?.items.find((item) => item.id === chapterId);

  useEffect(() => {
    pending.current = { chapterId, pageIndex };

    // Главы из другой ветки в этом списке нет — тогда отметку обновит ответ сервера.
    if (chapter) {
      queryClient.setQueryData<TitleReadingProgressResponse>(
        getReadingProgressQueryKey(titleId),
        (current) => ({
          own: toOptimisticProgress(chapter, pageIndex),
          linked: current?.linked ?? [],
        }),
      );
    }

    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [titleId, chapterId, pageIndex, chapter, queryClient, flush]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushOnExit();
    };

    // visibilitychange приходит при сворачивании и закрытии, pagehide — ещё и при перезагрузке
    // и в Safari, где на закрытие первого события может не быть. Повтор отсекает lastSavedKey.
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushOnExit);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushOnExit);
      // Уход внутри приложения: страница живёт дальше, так что через мутацию — с ответом в кеш.
      flush();
    };
  }, [flush, flushOnExit]);
}

export default useSaveReadingProgress;

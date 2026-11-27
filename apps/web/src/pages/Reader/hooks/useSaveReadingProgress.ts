import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TitleReadingProgressResponse } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import { getReadingProgressQueryKey } from '@/entities/title/hooks/useReadingProgress';
import useUpdateReadingProgress from '@/entities/title/hooks/useUpdateReadingProgress';
import { sendReadingProgress } from '@/entities/title/progressSync';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { CONTINUE_READING_QUERY_KEY } from '@/entities/title/models';
import { toOptimisticProgress } from '@/entities/title/readingProgress';
import { getReaderPageKey } from '../lib';
import type { ReaderPosition } from '../models';

/** После остановки позиция сохраняется быстрее очередного checkpoint. */
const SAVE_DELAY_MS = 2000;
/** Непрерывное листание тоже сохраняется; этот же таймер повторяет неудачную отправку. */
const CHECKPOINT_INTERVAL_MS = 5000;

type SavedPosition = ReaderPosition & { chapterCompleted: boolean };

type Params = {
  titleId: string;
  position: SavedPosition | null;
};

export const getProgressKey = (position: SavedPosition) =>
  `${getReaderPageKey(position)}:${position.chapterCompleted}`;

/**
 * Запоминает, где остановились. В кеш позиция пишется сразу — список глав в drawer'е и кнопка
 * «Продолжить» видят её без задержки, — а на сервер уходит с задержкой либо немедленно, если
 * читалку не дождались: ушли на другую страницу приложения, спрятали, закрыли или перезагрузили
 * вкладку.
 */
function useSaveReadingProgress({ titleId, position }: Params) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useUpdateReadingProgress({ titleId, notifyOnError: false });
  // Та же ветка по умолчанию, что и у шапки читалки: запрос уже в кеше.
  const { data: chaptersData } = useChapters({ titleId });
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  const pending = useRef<SavedPosition | null>(null);
  const lastSavedKey = useRef<string | null>(null);
  const inFlightKey = useRef<string | null>(null);
  const exitInFlightKey = useRef<string | null>(null);
  const isLeaving = useRef(false);

  const getPending = useCallback(() => {
    const target = pending.current;
    if (!target) return null;
    const key = getProgressKey(target);
    return key === lastSavedKey.current ||
      key === inFlightKey.current ||
      key === exitInFlightKey.current
      ? null
      : target;
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    // Пока запрос летит, новые страницы заменяют pending: устаревшие позиции не копим.
    if (inFlightKey.current !== null || exitInFlightKey.current !== null) return;
    let target = getPending();
    while (target) {
      const key = getProgressKey(target);
      inFlightKey.current = key;
      try {
        await mutateAsync(target);
        lastSavedKey.current = key;
      } catch {
        // Позиция остаётся несохранённой: следующий checkpoint или выход повторит запрос.
      } finally {
        inFlightKey.current = null;
      }
      // При уходе могла ещё лететь предыдущая страница. Дождавшись её, сохраняем последнюю.
      // Неудачный запрос той же позиции здесь не повторяем: это дело таймера.
      target = isLeaving.current ? getPending() : null;
      if (target && getProgressKey(target) === key) return;
    }
  }, [getPending, mutateAsync]);

  // Страница уходит: мутация стартует запрос только после await в onMutate и может не успеть,
  // поэтому запрос шлётся напрямую, прямо в обработчике.
  const flushOnExit = useCallback(() => {
    const target = getPending();
    if (!target) return;
    const key = getProgressKey(target);
    exitInFlightKey.current = key;
    sendReadingProgress(userId, titleId, target)
      .then(() => {
        lastSavedKey.current = key;
        return queryClient.invalidateQueries({ queryKey: CONTINUE_READING_QUERY_KEY });
      })
      .catch(() => undefined)
      .finally(() => {
        exitInFlightKey.current = null;
        // После возврата во вкладку читатель мог уйти с более новой страницы.
        // Повтор той же неудачной позиции оставляем таймеру, пока читалка открыта.
        const target = getPending();
        if (isLeaving.current && target && getProgressKey(target) !== key) void flush();
      });
  }, [getPending, userId, titleId, queryClient, flush]);

  const checkpoint = useEffectEvent(flush);
  useEffect(() => {
    const timer = setInterval(checkpoint, CHECKPOINT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const chapterId = position?.chapterId;
  const pageIndex = position?.pageIndex;
  const chapterCompleted = position?.chapterCompleted;
  const chapter = chaptersData?.items.find((item) => item.id === chapterId);

  useEffect(() => {
    if (chapterId === undefined || pageIndex === undefined || chapterCompleted === undefined)
      return;
    pending.current = { chapterId, pageIndex, chapterCompleted };

    // Главы из другой ветки в этом списке нет — тогда отметку обновит ответ сервера.
    if (chapter) {
      queryClient.setQueryData<TitleReadingProgressResponse>(
        getReadingProgressQueryKey(titleId),
        (current) => ({
          own: toOptimisticProgress(chapter, pageIndex, chapterCompleted),
          linked: current?.linked ?? [],
        }),
      );
    }

    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [titleId, chapterId, pageIndex, chapterCompleted, chapter, queryClient, flush]);

  useEffect(() => {
    isLeaving.current = false;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushOnExit();
    };

    // visibilitychange приходит при сворачивании и закрытии, pagehide — ещё и при перезагрузке
    // и в Safari, где на закрытие первого события может не быть. Повтор отсекается даже до ответа.
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushOnExit);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushOnExit);
      // Уход внутри приложения: страница живёт дальше, так что через мутацию — с ответом в кеш.
      isLeaving.current = true;
      void flush();
    };
  }, [flush, flushOnExit]);
}

export default useSaveReadingProgress;

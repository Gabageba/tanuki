import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { Chapter, ReadingProgress, TitleReadingProgressResponse } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';
import { toOptimisticProgress } from '../readingProgress';
import { getReadingProgressQueryKey } from './useReadingProgress';

type Params = {
  titleId: string;
  /** Читалка сохраняет позицию фоном каждые пару секунд: без сети уведомление об ошибке
   *  всплывало бы на каждой странице, поэтому там оно выключено. */
  notifyOnError?: boolean;
};

type ProgressPosition = {
  chapterId: string;
  pageIndex: number;
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

type Variables = {
  chapterId: string;
  pageIndex: number;
  /** Глава целиком, если она под рукой: тогда отметка переезжает сразу, до ответа сервера. */
  chapter?: Chapter;
};

/**
 * Переносит отметку «остановился здесь». Если сохранение упало, кеш откатывается к прежней
 * отметке — список глав не останется в состоянии, которого нет на сервере.
 */
function useUpdateReadingProgress({ titleId, notifyOnError = true }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = getReadingProgressQueryKey(titleId);

  return useMutation({
    mutationFn: (variables: Variables) => saveReadingProgress(titleId, variables),
    onMutate: async ({ chapter, pageIndex }) => {
      // Иначе уже летящий GET приземлится поверх и вернёт отметку на прежнее место.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TitleReadingProgressResponse>(queryKey);
      if (chapter) {
        queryClient.setQueryData<TitleReadingProgressResponse>(queryKey, (current) => ({
          own: toOptimisticProgress(chapter, pageIndex),
          linked: current?.linked ?? [],
        }));
      }
      return { previous };
    },
    onSuccess: (own) => {
      queryClient.setQueryData<TitleReadingProgressResponse>(queryKey, (current) => ({
        own,
        linked: current?.linked ?? [],
      }));
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      if (!notifyOnError) return;
      notifications.show({
        color: 'red',
        title: t('failedToSave'),
        message: error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
      });
    },
  });
}

export default useUpdateReadingProgress;

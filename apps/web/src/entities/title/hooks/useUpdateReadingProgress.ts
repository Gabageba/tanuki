import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TitleReadingProgressResponse } from '@tanuki/contracts';
import { SILENT_ERROR_META, type ErrorMeta } from '@/shared/api/errorMeta';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { CONTINUE_READING_QUERY_KEY } from '../models';
import { sendReadingProgress, type ProgressPosition } from '../progressSync';
import { toOptimisticProgress } from '../readingProgress';
import { getReadingProgressQueryKey } from './useReadingProgress';

type Params = {
  titleId: string;
  /** Читалка сохраняет позицию фоном каждые пару секунд: без сети уведомление об ошибке
   *  всплывало бы на каждой странице, поэтому там оно выключено. */
  notifyOnError?: boolean;
};

/**
 * Переносит отметку «остановился здесь». Если сохранение упало, кеш откатывается к прежней
 * отметке — список глав не останется в состоянии, которого нет на сервере. Без сети отметка встаёт
 * в очередь отправки и остаётся на месте: уйдёт, когда сеть появится.
 */
function useUpdateReadingProgress({ titleId, notifyOnError = true }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const queryKey = getReadingProgressQueryKey(titleId);

  return useMutation({
    // Без сети мутация не встаёт на паузу: её mutationFn сама кладёт отметку в очередь отправки.
    networkMode: 'offlineFirst',
    meta: notifyOnError
      ? ({ errorTitle: t('failedToSave') } satisfies ErrorMeta)
      : SILENT_ERROR_META,
    mutationFn: (variables: ProgressPosition) => sendReadingProgress(user?.id, titleId, variables),
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
      if (!own) return;
      queryClient.setQueryData<TitleReadingProgressResponse>(queryKey, (current) => ({
        own,
        linked: current?.linked ?? [],
      }));
      void queryClient.invalidateQueries({ queryKey: CONTINUE_READING_QUERY_KEY });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });
}

export default useUpdateReadingProgress;

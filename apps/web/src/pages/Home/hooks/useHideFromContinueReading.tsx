import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { ContinueReadingResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import UndoToastMessage from '@/shared/ui/UndoToastMessage';
import { CONTINUE_READING_QUERY_KEY } from '@/entities/title/models';
import { RESTORE_TOAST_MS } from '../models';

/**
 * Убирает тайтл из «Продолжить чтение» без модалки: карточка пропадает сразу, тост «Отменить»
 * возвращает её на место. Прогресс чтения не трогается.
 */
function useHideFromContinueReading() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = CONTINUE_READING_QUERY_KEY;

  const restore = useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (titleId: string) =>
      apiFetch(`/titles/${titleId}/progress/hidden`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (titleId: string) =>
      apiFetch(`/titles/${titleId}/progress/hidden`, { method: 'PUT' }),
    onMutate: async (titleId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ContinueReadingResponse>(queryKey);
      queryClient.setQueryData<ContinueReadingResponse>(
        queryKey,
        (current) =>
          current && { items: current.items.filter((item) => item.title.id !== titleId) },
      );
      return { previous };
    },
    onError: (_error, _titleId, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSuccess: (_data, titleId) => {
      const toastId = notifications.show({
        autoClose: RESTORE_TOAST_MS,
        message: (
          <UndoToastMessage
            message={t('titleRemovedFromContinueReading')}
            actionLabel={t('cancel')}
            onAction={() => {
              notifications.hide(toastId);
              restore.mutate(titleId);
            }}
          />
        ),
      });
    },
  });
}

export default useHideFromContinueReading;

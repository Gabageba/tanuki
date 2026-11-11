import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND } from '@/shared/lib/toasts/models';
import type { ContinueReadingResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import UndoToastMessage from '@/shared/ui/UndoToastMessage';
import { CONTINUE_READING_QUERY_KEY } from '@/entities/title/models';

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
      const ownerVersion = Toasts.getOwnerVersion();
      await queryClient.cancelQueries({ queryKey });
      if (ownerVersion !== Toasts.getOwnerVersion())
        throw new DOMException('Session changed', 'AbortError');
      const previous = queryClient.getQueryData<ContinueReadingResponse>(queryKey);
      queryClient.setQueryData<ContinueReadingResponse>(
        queryKey,
        (current) =>
          current && { items: current.items.filter((item) => item.title.id !== titleId) },
      );
      return { previous, ownerVersion };
    },
    onError: (_error, _titleId, context) => {
      if (context?.ownerVersion === Toasts.getOwnerVersion())
        queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (_data, titleId, context) => {
      if (context?.ownerVersion !== Toasts.getOwnerVersion()) return;
      const toastId = Toasts.show({
        kind: TOAST_KIND.UNDO,
        tone: FEEDBACK_TONE.ACCENT,
        icon: <BookmarkSimpleIcon size={20} />,
        title: t('titleRemovedFromContinueReading'),
        actions: (
          <UndoToastMessage
            actionsOnly
            actionLabel={t('restoreTitle')}
            onAction={() => Toasts.act(toastId, () => restore.mutate(titleId))}
          />
        ),
      });
    },
  });
}

export default useHideFromContinueReading;

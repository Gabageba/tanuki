import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND } from '@/shared/lib/toasts/models';
import type {
  RemoveTitleBookmarkResponse,
  RestoreBookmarksRequest,
  TitleBookmark,
} from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { getTitleBookmarkQueryKey } from '@/entities/bookmark/models';
import UndoToastMessage from '@/shared/ui/UndoToastMessage';

/**
 * Убирает закладку всей группы без модалки — тост «Убрано из закладок» с «Вернуть» кладёт
 * удалённые строки обратно как были.
 */
function useRemoveTitleBookmark(titleId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = getTitleBookmarkQueryKey(titleId);

  const restore = useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (rows: RemoveTitleBookmarkResponse['rows']) =>
      apiFetch('/bookmarks/restore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows } satisfies RestoreBookmarksRequest),
      }),
    onSettled: () => invalidateBookmarks(queryClient),
  });

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: () =>
      apiFetch<RemoveTitleBookmarkResponse>(`/titles/${titleId}/bookmark`, { method: 'DELETE' }),
    onMutate: async () => {
      const ownerVersion = Toasts.getOwnerVersion();
      await queryClient.cancelQueries({ queryKey });
      if (ownerVersion !== Toasts.getOwnerVersion())
        throw new DOMException('Session changed', 'AbortError');
      const previous = queryClient.getQueryData<TitleBookmark>(queryKey);
      queryClient.setQueryData<TitleBookmark>(queryKey, { folderId: null, conflict: null });
      return { previous, ownerVersion };
    },
    onError: (_error, _variables, context) => {
      if (context?.ownerVersion === Toasts.getOwnerVersion())
        queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: ({ rows }, _variables, context) => {
      if (rows.length === 0 || context?.ownerVersion !== Toasts.getOwnerVersion()) return;
      const toastId = Toasts.show({
        kind: TOAST_KIND.UNDO,
        tone: FEEDBACK_TONE.ACCENT,
        icon: <BookmarkSimpleIcon size={20} />,
        title: t('removedFromBookmarks'),
        actions: (
          <UndoToastMessage
            actionsOnly
            actionLabel={t('restoreBookmark')}
            onAction={() => Toasts.act(toastId, () => restore.mutate(rows))}
          />
        ),
      });
    },
    onSettled: () => invalidateBookmarks(queryClient),
  });
}

export default useRemoveTitleBookmark;

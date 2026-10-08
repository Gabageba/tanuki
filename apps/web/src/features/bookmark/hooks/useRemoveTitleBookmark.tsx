import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type {
  RemoveTitleBookmarkResponse,
  RestoreBookmarksRequest,
  TitleBookmark,
} from '@tanuki/contracts';
import { ApiRequestError, apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { getTitleBookmarkQueryKey } from '@/entities/bookmark/models';
import RemovedFromBookmarksMessage from '../RemovedFromBookmarksMessage';

/** Сколько держится тост с «Вернуть». */
const RESTORE_TOAST_MS = 6000;

/**
 * Убирает закладку всей группы без модалки — тост «Убрано из закладок» с «Вернуть» кладёт
 * удалённые строки обратно как были.
 */
function useRemoveTitleBookmark(titleId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = getTitleBookmarkQueryKey(titleId);

  const restore = async (rows: RemoveTitleBookmarkResponse['rows'], toastId: string) => {
    notifications.hide(toastId);
    try {
      await apiFetch('/bookmarks/restore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows } satisfies RestoreBookmarksRequest),
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: t('failedToSave'),
        message: error instanceof ApiRequestError ? error.message : t('somethingWentWrong'),
      });
    }
    await invalidateBookmarks(queryClient);
  };

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: () =>
      apiFetch<RemoveTitleBookmarkResponse>(`/titles/${titleId}/bookmark`, { method: 'DELETE' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TitleBookmark>(queryKey);
      queryClient.setQueryData<TitleBookmark>(queryKey, { folderId: null, conflict: null });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSuccess: ({ rows }) => {
      if (rows.length === 0) return;
      const toastId = notifications.show({
        autoClose: RESTORE_TOAST_MS,
        message: <RemovedFromBookmarksMessage onRestore={() => void restore(rows, toastId)} />,
      });
    },
    onSettled: () => invalidateBookmarks(queryClient),
  });
}

export default useRemoveTitleBookmark;

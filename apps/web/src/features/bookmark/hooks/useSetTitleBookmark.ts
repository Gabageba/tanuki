import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { SetTitleBookmarkRequest, TitleBookmark } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { getTitleBookmarkQueryKey } from '@/entities/bookmark/models';

/** Кладёт тайтл в папку или переносит туда всю группу — сразу, не дожидаясь сервера. */
function useSetTitleBookmark(titleId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = getTitleBookmarkQueryKey(titleId);

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (folderId: string) =>
      apiFetch<TitleBookmark>(`/titles/${titleId}/bookmark`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ folderId } satisfies SetTitleBookmarkRequest),
      }),
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TitleBookmark>(queryKey);
      queryClient.setQueryData<TitleBookmark>(queryKey, { folderId, conflict: null });
      return { previous };
    },
    onError: (_error, _folderId, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => invalidateBookmarks(queryClient),
  });
}

export default useSetTitleBookmark;

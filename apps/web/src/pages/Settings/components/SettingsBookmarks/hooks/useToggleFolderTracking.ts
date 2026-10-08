import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BookmarkFoldersResponse, UpdateBookmarkFolderRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { BOOKMARK_FOLDERS_QUERY_KEY } from '@/entities/bookmark/models';

type Variables = {
  folderId: string;
  trackUpdates: boolean;
};

/** Тумблер «Следить за обновлениями» переключается сразу; при ошибке возвращается обратно. */
function useToggleFolderTracking() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: ({ folderId, trackUpdates }: Variables) =>
      apiFetch(`/bookmark-folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ trackUpdates } satisfies UpdateBookmarkFolderRequest),
      }),
    onMutate: async ({ folderId, trackUpdates }) => {
      await queryClient.cancelQueries({ queryKey: BOOKMARK_FOLDERS_QUERY_KEY });
      const previous = queryClient.getQueryData<BookmarkFoldersResponse>(
        BOOKMARK_FOLDERS_QUERY_KEY,
      );
      if (previous) {
        queryClient.setQueryData<BookmarkFoldersResponse>(BOOKMARK_FOLDERS_QUERY_KEY, {
          ...previous,
          items: previous.items.map((folder) =>
            folder.id === folderId ? { ...folder, trackUpdates } : folder,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(BOOKMARK_FOLDERS_QUERY_KEY, context.previous);
    },
    onSettled: () => invalidateBookmarks(queryClient),
  });
}

export default useToggleFolderTracking;

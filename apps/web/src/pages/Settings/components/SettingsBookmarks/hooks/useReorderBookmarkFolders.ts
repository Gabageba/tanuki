import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BookmarkFoldersResponse, ReorderBookmarkFoldersRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { BOOKMARK_FOLDERS_QUERY_KEY } from '@/entities/bookmark/models';

/** Строка встаёт на новое место сразу, не дожидаясь сервера; при ошибке порядок возвращается. */
function useReorderBookmarkFolders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch('/bookmark-folders/order', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids } satisfies ReorderBookmarkFoldersRequest),
      }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: BOOKMARK_FOLDERS_QUERY_KEY });
      const previous = queryClient.getQueryData<BookmarkFoldersResponse>(
        BOOKMARK_FOLDERS_QUERY_KEY,
      );
      if (previous) {
        queryClient.setQueryData<BookmarkFoldersResponse>(BOOKMARK_FOLDERS_QUERY_KEY, {
          ...previous,
          items: [...previous.items].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
        });
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(BOOKMARK_FOLDERS_QUERY_KEY, context.previous);
    },
  });
}

export default useReorderBookmarkFolders;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BookmarkFoldersResponse, UpdateBookmarkFolderRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { BOOKMARK_FOLDERS_QUERY_KEY, BOOKMARKS_QUERY_KEY } from '@/entities/bookmark/models';

type Variables = {
  folderId: string;
  trackUpdates: boolean;
};

const TOGGLE_FOLDER_TRACKING_MUTATION_KEY = ['toggle-folder-tracking'];

/** Тумблер «Следить за обновлениями» переключается сразу; при ошибке возвращается обратно. */
function useToggleFolderTracking() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: TOGGLE_FOLDER_TRACKING_MUTATION_KEY,
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
    // Оптимистично меняется только сам тумблер, а от слежения зависят и счётчики новых глав — у
    // закладок и у папок (точки на вкладках и в шапке). Папки обновляются тихо, ответом в кэш:
    // перезапрос показал бы скелетон на месте списка, где тумблер только что щёлкнули. Ответ
    // пишет только последний из идущих подряд тумблеров — более ранний затёр бы оптимистичное
    // значение следующего; не дошедший ответ ничего не откатывает.
    onSettled: async () => {
      void queryClient.invalidateQueries({ queryKey: BOOKMARKS_QUERY_KEY });
      const isLatest = () =>
        queryClient.isMutating({ mutationKey: TOGGLE_FOLDER_TRACKING_MUTATION_KEY }) <= 1;
      if (!isLatest()) return;
      try {
        const folders = await apiFetch<BookmarkFoldersResponse>('/bookmark-folders');
        if (isLatest()) queryClient.setQueryData(BOOKMARK_FOLDERS_QUERY_KEY, folders);
      } catch {
        // Папки обновятся со следующим перезапросом.
      }
    },
  });
}

export default useToggleFolderTracking;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateBookmarkFolderRequest, UpdateBookmarkFolderRequest } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';

type Variables = {
  /** Своя папка для переименования; нет — создаём новую. */
  folderId?: string;
  body: CreateBookmarkFolderRequest;
};

/**
 * Создаёт папку или сохраняет правку своей. Ошибку разбирает форма: занятое название встаёт под
 * поле, поэтому общее уведомление не нужно.
 */
function useSaveBookmarkFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: SILENT_ERROR_META,
    mutationFn: ({ folderId, body }: Variables): Promise<unknown> =>
      folderId
        ? apiFetch<void>(`/bookmark-folders/${folderId}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body satisfies UpdateBookmarkFolderRequest),
          })
        : apiFetch('/bookmark-folders', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }),
    onSettled: () => invalidateBookmarks(queryClient),
  });
}

export default useSaveBookmarkFolder;

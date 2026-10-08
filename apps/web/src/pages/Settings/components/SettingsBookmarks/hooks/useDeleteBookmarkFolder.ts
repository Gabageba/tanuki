import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';

type Variables = {
  folderId: string;
  /** Куда перенести закладки папки; нет — они удаляются вместе с ней. */
  moveTo?: string;
};

function useDeleteBookmarkFolder() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: ({ folderId, moveTo }: Variables) =>
      apiFetch(
        `/bookmark-folders/${folderId}${moveTo ? `?${new URLSearchParams({ moveTo })}` : ''}`,
        { method: 'DELETE' },
      ),
    onSettled: () => invalidateBookmarks(queryClient),
  });
}

export default useDeleteBookmarkFolder;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  API_ERROR_CODE,
  TITLE_LINK_VERDICT,
  type TitleLinkRequest,
  type TitleLinkVerdict,
} from '@tanuki/contracts';
import { ApiRequestError, apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import { getReadingProgressQueryKey } from '@/entities/title/hooks/useReadingProgress';

type Params = {
  titleId: string;
  /** Обе стороны в закладках в разных папках — связь не поставлена, нужно выбрать папку. */
  onBookmarkConflict: (targetId: string) => void;
};

type Variables = {
  targetId: string;
  verdict: TitleLinkVerdict;
  bookmarkFolderId?: string;
};

/** Связь не поставлена: сервер ждёт выбора папки для закладки. */
const isBookmarkConflict = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.BOOKMARK_FOLDER_CONFLICT;

/**
 * Ручная правка связи между тайтлами. Правки глобальны — их видят все, кто откроет тайтл, —
 * и применяются поверх кеша матчей, поэтому достаточно перезапросить именно его. Заодно —
 * прогресс чтения и закладки: они общие для группы подтверждённых совпадений, и с новой связью
 * в них могут появиться (или пропасть) другие источники.
 *
 * Конфликт папок закладок — не ошибка: мутация завершается без связи, а onBookmarkConflict
 * открывает выбор папки, после которого запрос повторяется с bookmarkFolderId.
 */
function useSetTitleLink({ titleId, onBookmarkConflict }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: async ({ targetId, verdict, bookmarkFolderId }: Variables) => {
      try {
        await apiFetch(`/titles/${titleId}/links`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            targetId,
            verdict,
            bookmarkFolderId,
          } satisfies TitleLinkRequest),
        });
        return { isLinked: true };
      } catch (error) {
        if (verdict === TITLE_LINK_VERDICT.CONFIRMED && isBookmarkConflict(error)) {
          onBookmarkConflict(targetId);
          return { isLinked: false };
        }
        throw error;
      }
    },
    onSuccess: ({ isLinked }) =>
      isLinked &&
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['title', titleId, 'matches'] }),
        queryClient.invalidateQueries({ queryKey: getReadingProgressQueryKey(titleId) }),
        invalidateBookmarks(queryClient),
      ]),
  });
}

export default useSetTitleLink;

import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  API_ERROR_CODE,
  TITLE_LINK_VERDICT,
  type TitleLinkRequest,
  type TitleLinkVerdict,
} from '@tanuki/contracts';
import { ApiRequestError, apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';

type Params = {
  titleId: string;
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
 * и применяются поверх кеша матчей. Вызывающий код обновляет совпадения, прогресс и закладки
 * после всей очереди, чтобы лента не перезагружалась между отдельными решениями.
 *
 * Конфликт папок закладок — не ошибка: мутация завершается без связи, вызывающий код
 * открывает выбор папки и повторяет запрос с bookmarkFolderId.
 */
function useSetTitleLink({ titleId }: Params) {
  const { t } = useTranslation();

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
          return { isLinked: false };
        }
        throw error;
      }
    },
  });
}

export default useSetTitleLink;

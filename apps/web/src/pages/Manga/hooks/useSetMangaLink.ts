import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { MangaLinkVerdict } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

type Params = {
  mangaId: string;
};

type Variables = {
  targetId: string;
  verdict: MangaLinkVerdict;
};

/**
 * Ручная правка связи между тайтлами. Правки глобальны — их видят все, кто откроет тайтл, —
 * и применяются поверх кеша матчей, поэтому достаточно перезапросить именно его.
 */
function useSetMangaLink({ mangaId }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, verdict }: Variables) =>
      apiFetch(`/manga/${mangaId}/links`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId, verdict }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manga', mangaId, 'matches'] }),
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: t('failedToSave'),
        message: error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
      }),
  });
}

export default useSetMangaLink;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { MangaLinkVerdict } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

type Params = {
  sourceId: string;
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
function useSetMangaLink({ sourceId, mangaId }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, verdict }: Variables) =>
      apiFetch(`/manga/${sourceId}/${mangaId}/links`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId, verdict }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['manga', sourceId, mangaId, 'matches'] }),
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: 'Не удалось сохранить',
        message: error instanceof ApiRequestError ? error.message : 'Попробуйте позже',
      }),
  });
}

export default useSetMangaLink;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { TitleLinkVerdict } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

type Params = {
  titleId: string;
};

type Variables = {
  targetId: string;
  verdict: TitleLinkVerdict;
};

/**
 * Ручная правка связи между тайтлами. Правки глобальны — их видят все, кто откроет тайтл, —
 * и применяются поверх кеша матчей, поэтому достаточно перезапросить именно его.
 */
function useSetTitleLink({ titleId }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, verdict }: Variables) =>
      apiFetch(`/titles/${titleId}/links`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId, verdict }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['title', titleId, 'matches'] }),
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: t('failedToSave'),
        message: error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
      }),
  });
}

export default useSetTitleLink;

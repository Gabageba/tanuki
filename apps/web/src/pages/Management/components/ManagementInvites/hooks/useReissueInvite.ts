import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { CreateInviteResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { INVITES_QUERY_KEY } from './useInvites';

/** Отзывает приглашение и выпускает новое с той же ролью — в ответе новый код. */
function useReissueInvite() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (id: string) =>
      apiFetch<CreateInviteResponse>(`/invites/${id}/reissue`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY }),
  });
}

export default useReissueInvite;

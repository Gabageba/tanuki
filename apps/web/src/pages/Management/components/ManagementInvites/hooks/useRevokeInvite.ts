import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Invite } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { INVITES_QUERY_KEY } from './useInvites';

function useRevokeInvite() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (id: string) => apiFetch<Invite>(`/invites/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY }),
  });
}

export default useRevokeInvite;

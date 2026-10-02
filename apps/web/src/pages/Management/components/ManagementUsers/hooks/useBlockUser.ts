import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BlockUserRequest, ManagedUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { MANAGED_USERS_QUERY_KEY } from './useManagedUsers';

type Variables = BlockUserRequest & {
  id: string;
};

function useBlockUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: ({ id, until, reason }: Variables) =>
      apiFetch<ManagedUser>(`/users/${id}/block`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ until, reason } satisfies BlockUserRequest),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY }),
  });
}

export default useBlockUser;

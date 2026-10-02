import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { ChangeUserRoleRequest, ManagedUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { MANAGED_USERS_QUERY_KEY } from './useManagedUsers';

type Variables = ChangeUserRoleRequest & {
  id: string;
};

function useChangeUserRole() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: ({ id, role }: Variables) =>
      apiFetch<ManagedUser>(`/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role } satisfies ChangeUserRoleRequest),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY }),
  });
}

export default useChangeUserRole;

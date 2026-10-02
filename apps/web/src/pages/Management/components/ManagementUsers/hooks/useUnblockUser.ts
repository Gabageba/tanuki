import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { ManagedUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';
import { MANAGED_USERS_QUERY_KEY } from './useManagedUsers';

function useUnblockUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorTitle: t('failedToSave') } satisfies ErrorMeta,
    mutationFn: (id: string) => apiFetch<ManagedUser>(`/users/${id}/block`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY }),
  });
}

export default useUnblockUser;

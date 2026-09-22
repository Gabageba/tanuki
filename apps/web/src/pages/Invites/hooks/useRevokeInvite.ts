import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiRequestError } from '@/shared/api/client';
import { INVITES_QUERY_KEY } from './useInvites';

function useRevokeInvite() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/invites/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY }),
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: t('failedToSave'),
        message: error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
      }),
  });
}

export default useRevokeInvite;

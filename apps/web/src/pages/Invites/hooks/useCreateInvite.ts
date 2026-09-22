import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { CreateInviteRequest, CreateInviteResponse } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';
import { INVITES_QUERY_KEY } from './useInvites';

function useCreateInvite() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateInviteRequest) =>
      apiFetch<CreateInviteResponse>('/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY }),
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: t('failedToSave'),
        message: error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
      }),
  });
}

export default useCreateInvite;

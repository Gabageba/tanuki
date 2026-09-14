import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

function useProbeAllSources() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch('/sources/probe', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      notifications.show({ color: 'green', title: t('checkFinished'), message: t('allSources') });
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        title: t('error'),
        message: error instanceof ApiRequestError ? error.message : t('checkFailed'),
      }),
  });
}

export default useProbeAllSources;

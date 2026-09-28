import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/shared/api/client';

function useProbeAllSources() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch('/sources/probe', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      notifications.show({ color: 'green', title: t('checkFinished'), message: t('allSources') });
    },
  });
}

export default useProbeAllSources;

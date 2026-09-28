import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/shared/api/client';

type Params = { sourceId: string; sourceTitle: string };

function useProbeSource({ sourceId, sourceTitle }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch(`/sources/${sourceId}/probe`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      notifications.show({ color: 'green', title: t('checkPassed'), message: sourceTitle });
    },
  });
}

export default useProbeSource;

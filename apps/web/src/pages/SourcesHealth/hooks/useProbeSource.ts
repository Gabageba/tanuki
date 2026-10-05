import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = { sourceId: string; sourceTitle: string };

/** «Закончена», а не «прошла»: ручка отвечает источником и тогда, когда он остался лежать, —
 *  итог виден по статусу в карточке. */
function useProbeSource({ sourceId, sourceTitle }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<Source>(`/sources/${sourceId}/probe`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      notifications.show({ color: 'green', title: t('checkFinished'), message: sourceTitle });
    },
  });
}

export default useProbeSource;

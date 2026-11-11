import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Toasts } from '@/shared/lib/toasts/store';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
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
      Toasts.show({
        tone: FEEDBACK_TONE.SUCCESS,
        title: t('checkFinished'),
        description: sourceTitle,
      });
    },
  });
}

export default useProbeSource;

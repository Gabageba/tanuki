import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Toasts } from '@/shared/lib/toasts/store';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { apiFetch } from '@/shared/api/client';

function useProbeAllSources() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch('/sources/probe', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      Toasts.show({
        tone: FEEDBACK_TONE.SUCCESS,
        title: t('checkFinished'),
        description: t('allSources'),
      });
    },
  });
}

export default useProbeAllSources;

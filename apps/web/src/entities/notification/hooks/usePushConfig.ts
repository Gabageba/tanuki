import { useQuery } from '@tanstack/react-query';
import type { PushConfig } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { PUSH_CONFIG_QUERY_KEY } from '../models';

/** Push — опция инстанса: без VAPID-ключей `enabled` false, и блока push нигде нет. */
function usePushConfig() {
  return useQuery({
    queryKey: PUSH_CONFIG_QUERY_KEY,
    queryFn: () => apiFetch<PushConfig>('/notifications/push/config'),
    staleTime: Infinity,
    // Без ответа push просто не предлагается — шуметь об этом незачем.
    meta: SILENT_ERROR_META,
  });
}

export default usePushConfig;

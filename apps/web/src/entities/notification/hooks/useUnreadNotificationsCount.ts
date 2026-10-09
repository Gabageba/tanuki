import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UnreadCount } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { UNREAD_COUNT_POLL_MS, UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY } from '../models';
import { getStreamConnected, subscribeToStreamStatus } from '../streamStatus';

/** Число непрочитанных для колокольчика. Пока поток SSE не подключён, спрашивает раз в минуту. */
function useUnreadNotificationsCount() {
  const isStreamConnected = useSyncExternalStore(subscribeToStreamStatus, getStreamConnected);

  return useQuery({
    queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
    queryFn: () => apiFetch<UnreadCount>('/notifications/unread-count'),
    select: ({ count }) => count,
    refetchInterval: isStreamConnected ? false : UNREAD_COUNT_POLL_MS,
    // Фоновый опрос: его сбой человеку сообщать незачем, бейджа просто нет.
    meta: SILENT_ERROR_META,
  });
}

export default useUnreadNotificationsCount;

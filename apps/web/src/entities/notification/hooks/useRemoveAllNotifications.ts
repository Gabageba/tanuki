import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationCategory } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { NOTIFICATIONS_QUERY_KEY, UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY } from '../models';

/** Убирает всё, что видно с учётом категорий; пустой список — вообще всё. */
function useRemoveAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categories: NotificationCategory[]) => {
      const params = new URLSearchParams();
      if (categories.length > 0) {
        params.set('category', categories.join(','));
      }
      return apiFetch(`/notifications?${params.toString()}`, { method: 'DELETE' });
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY }),
      ]),
  });
}

export default useRemoveAllNotifications;

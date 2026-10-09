import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { NOTIFICATIONS_QUERY_KEY, UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY } from '../models';

/** «Прочитано» — это удаление записи; пропавшую раньше (визит в тайтл убрал её сам) не считаем ошибкой. */
function useRemoveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: SILENT_ERROR_META,
    mutationFn: (id: string) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY }),
      ]),
  });
}

export default useRemoveNotification;

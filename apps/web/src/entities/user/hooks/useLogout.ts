import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { apiFetch } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  NOTIFICATIONS_QUERY_KEY,
  PUSH_SUBSCRIPTION_QUERY_KEY,
  UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
} from '@/entities/notification/models';
import { removePushSubscription } from '@/entities/notification/push';
import { CURRENT_USER_QUERY_KEY } from './useCurrentUser';

function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      // Подписка привязана к аккаунту, а не к сессии: без этого устройство продолжило бы получать
      // push вышедшего — и следующего, кто войдёт. Сбой здесь выходу не мешает.
      await removePushSubscription().catch(() => undefined);
      await apiFetch('/auth/logout', { method: 'POST' });
    },
    // Подписку сняли до запроса выхода — даже если он упал, кеш о ней уже врёт.
    onSettled: () => queryClient.invalidateQueries({ queryKey: PUSH_SUBSCRIPTION_QUERY_KEY }),
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY });
      navigate(ROUTE_PATHS.LOGIN);
    },
  });
}

export default useLogout;

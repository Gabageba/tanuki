import { useQueryClient } from '@tanstack/react-query';
import type { NotificationCategory } from '@tanuki/contracts';
import useNotifications from '@/entities/notification/hooks/useNotifications';
import usePushDevice from '@/entities/notification/hooks/usePushDevice';
import { UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY } from '@/entities/notification/models';

type Params = { categories: NotificationCategory[] };

/**
 * Главный запрос страницы: лента плюс состояние push. Скелетон ленты ждёт и то и другое, иначе
 * предложение push выскакивает над уже показанной лентой и сдвигает её вниз. Лента живая — её
 * обновляет поток SSE, перезапрос тихий.
 */
function useNotificationsFeed(params: Params) {
  const queryClient = useQueryClient();
  const notifications = useNotifications(params);
  const push = usePushDevice();

  const refresh = () =>
    Promise.all([
      notifications.refetch(),
      push.query.refetch(),
      queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY }),
    ]);

  return {
    ...notifications,
    data: push.isPending ? undefined : notifications.data,
    isPending: notifications.isPending || push.isPending,
    isLive: true,
    refresh,
  };
}

export default useNotificationsFeed;

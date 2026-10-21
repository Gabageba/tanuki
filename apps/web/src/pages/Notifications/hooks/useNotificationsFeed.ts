import type { NotificationCategory } from '@tanuki/contracts';
import useNotifications from '@/entities/notification/hooks/useNotifications';
import usePushDevice from '@/entities/notification/hooks/usePushDevice';

type Params = { categories: NotificationCategory[] };

/**
 * Главный запрос страницы: лента плюс состояние push. Скелетон ленты ждёт и то и другое, иначе
 * предложение push выскакивает над уже показанной лентой и сдвигает её вниз. Лента живая — её
 * обновляет поток SSE, перезапрос тихий.
 */
function useNotificationsFeed(params: Params) {
  const notifications = useNotifications(params);
  const push = usePushDevice();

  return {
    ...notifications,
    data: push.isPending ? undefined : notifications.data,
    isPending: notifications.isPending || push.isPending,
    isLive: true,
  };
}

export default useNotificationsFeed;

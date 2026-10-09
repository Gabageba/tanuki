import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { NotificationCategory, NotificationsPage } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { NOTIFICATIONS_QUERY_KEY } from '../models';

type Params = {
  /** Пусто — все категории. */
  categories: NotificationCategory[];
};

/** Лента непрочитанного, новые сверху; страницы подгружаются по мере прокрутки. */
function useNotifications({ categories }: Params) {
  return useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, categories],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (categories.length > 0) {
        params.set('category', categories.join(','));
      }
      return apiFetch<NotificationsPage>(`/notifications?${params.toString()}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    // Смена фильтра не прячет страницу под спиннер: фильтр остаётся на месте, пока грузится список.
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export default useNotifications;

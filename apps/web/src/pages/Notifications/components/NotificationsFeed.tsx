import { Stack } from '@mantine/core';
import type { NotificationCategory } from '@tanuki/contracts';
import useNotifications from '@/entities/notification/hooks/useNotifications';
import PushPrompt from '@/features/notification/PushPrompt';
import PageLayout from '@/shared/ui/PageLayout';
import NotificationsEmpty from './NotificationsEmpty';
import NotificationsList from './NotificationsList';
import NotificationsToolbar from './NotificationsToolbar';

type Params = { categories: NotificationCategory[] };

/** Содержимое ленты: предложение push, фильтр категорий, «убрать все», строки и подгрузка. */
function NotificationsFeed() {
  const { params, setParams } = PageLayout.useParams<Params>();
  const { data } = useNotifications(params);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Stack gap="md">
      <PushPrompt />
      <NotificationsToolbar isEmpty={items.length === 0} />
      <NotificationsList items={items} />
      <NotificationsEmpty
        isEmpty={items.length === 0}
        isFiltered={params.categories.length > 0}
        onResetFilter={() => setParams({ categories: [] })}
      />
      <PageLayout.InfiniteScrollTrigger />
    </Stack>
  );
}

export default NotificationsFeed;

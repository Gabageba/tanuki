import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import NotificationsFeed from './components/NotificationsFeed';
import NotificationsSkeleton from './components/NotificationsSkeleton';
import useNotificationsFeed from './hooks/useNotificationsFeed';
import useUrlState from '@/shared/hooks/useUrlState';
import { readNotificationsParams } from './lib';

function Notifications() {
  const { t } = useTranslation();
  const { params, setParams } = useUrlState(readNotificationsParams);

  return (
    <PageLayout useQuery={useNotificationsFeed} params={params} onParamsChange={setParams}>
      <PageLayout.PullToRefresh />
      <PageLayout.Content title={t('notifications')} skeleton={<NotificationsSkeleton />}>
        <NotificationsFeed />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Notifications;

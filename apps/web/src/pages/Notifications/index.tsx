import { useTranslation } from 'react-i18next';
import type { NotificationCategory } from '@tanuki/contracts';
import PageLayout from '@/shared/ui/PageLayout';
import NotificationsFeed from './components/NotificationsFeed';
import NotificationsSkeleton from './components/NotificationsSkeleton';
import useNotificationsFeed from './hooks/useNotificationsFeed';

const INITIAL_PARAMS = { categories: [] as NotificationCategory[] };

function Notifications() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useNotificationsFeed} params={INITIAL_PARAMS}>
      <PageLayout.Content title={t('notifications')} skeleton={<NotificationsSkeleton />}>
        <NotificationsFeed />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Notifications;

import { useTranslation } from 'react-i18next';
import type { NotificationCategory } from '@tanuki/contracts';
import useNotifications from '@/entities/notification/hooks/useNotifications';
import PageLayout from '@/shared/ui/PageLayout';
import NotificationsFeed from './components/NotificationsFeed';

const INITIAL_PARAMS = { categories: [] as NotificationCategory[] };

function Notifications() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useNotifications} params={INITIAL_PARAMS}>
      <PageLayout.Content title={t('notifications')}>
        <NotificationsFeed />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Notifications;

import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import DownloadsContent from './components/DownloadsContent';

/** «Загрузки»: очередь и скачанное на этом устройстве. Работает и без сети — всё из базы. */
function Downloads() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <PageLayout.Content title={t('downloads')}>
        <DownloadsContent />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Downloads;

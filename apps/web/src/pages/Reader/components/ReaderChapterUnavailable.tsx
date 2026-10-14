import { useTranslation } from 'react-i18next';
import OfflineEmptyState from '@/shared/ui/OfflineEmptyState';

/** Глава без сети и не скачана (U1): открыть её нечем. */
function ReaderChapterUnavailable() {
  const { t } = useTranslation();

  return (
    <OfflineEmptyState
      title={t('chapterNotDownloaded')}
      description={t('onlyDownloadedChaptersOpenOffline')}
    />
  );
}

export default ReaderChapterUnavailable;

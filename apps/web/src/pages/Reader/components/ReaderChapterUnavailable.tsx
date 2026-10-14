import { EmptyState } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CloudSlashIcon } from '@phosphor-icons/react';

/** Глава без сети и не скачана (U1): открыть её нечем. Кнопка «Открыть загрузки» появится вместе
 *  со страницей `/downloads`. */
function ReaderChapterUnavailable() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('chapterNotDownloaded')}
      description={t('onlyDownloadedChaptersOpenOffline')}
      icon={<CloudSlashIcon />}
    />
  );
}

export default ReaderChapterUnavailable;

import { EmptyState } from '@mantine/core';
import { ProhibitIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Браузер без service worker или IndexedDB — например, приватное окно. */
function DownloadsUnsupported() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('downloadingUnavailable')}
      description={t('browserDoesNotAllowSavingChapters')}
      icon={<ProhibitIcon />}
    />
  );
}

export default DownloadsUnsupported;

import { Alert, Text } from '@mantine/core';
import { HardDrivesIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DOWNLOAD_ERROR, type DownloadRow } from '@/entities/download/models';

type Props = {
  rows: DownloadRow[];
  isPaused: boolean;
};

/** Очередь встала: кончилось место. Что делать — освободить его и продолжить. */
function QueueQuotaAlert({ rows, isPaused }: Props) {
  const { t } = useTranslation();

  if (!isPaused || !rows.some((row) => row.error === DOWNLOAD_ERROR.QUOTA)) return null;

  return (
    <Alert variant="muted" color="red" icon={<HardDrivesIcon />} title={t('deviceOutOfSpace')}>
      <Text fz="sm">{t('downloadsPausedDeleteAndResume')}</Text>
    </Alert>
  );
}

export default QueueQuotaAlert;

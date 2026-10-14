import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { ArrowCounterClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DOWNLOAD_STATUS, type DownloadRow } from '@/entities/download/models';

type Props = {
  row: DownloadRow;
  onRetry: () => void;
  onCancel: () => void;
};

/** Повтор упавшей главы и крестик отмены; порядок меняет ручка слева. */
function QueueRowActions({ row, onRetry, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Group gap={4} wrap="nowrap" flex="none">
      {row.status === DOWNLOAD_STATUS.FAILED && (
        <Tooltip label={t('retryChapterDownload')}>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t('retryChapterDownload')}
            onClick={onRetry}
          >
            <ArrowCounterClockwiseIcon />
          </ActionIcon>
        </Tooltip>
      )}
      <Tooltip label={t('cancelChapterDownload')}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={t('cancelChapterDownload')}
          onClick={onCancel}
        >
          <XIcon />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

export default QueueRowActions;

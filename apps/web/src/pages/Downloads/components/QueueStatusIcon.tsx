import { RingProgress } from '@mantine/core';
import { ClockIcon, PauseCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { DOWNLOAD_STATUS, type DownloadRow } from '@/entities/download/models';

type Props = {
  row: DownloadRow;
  isPaused: boolean;
};

const SIZE = 20;

/** Значок строки очереди: те же знаки, что у строки главы, плюс пауза у текущей главы. */
function QueueStatusIcon({ row, isPaused }: Props) {
  switch (row.status) {
    case DOWNLOAD_STATUS.DOWNLOADING:
      return isPaused ? (
        <PauseCircleIcon size={SIZE} color="var(--mantine-color-dimmed)" />
      ) : (
        <RingProgress
          size={SIZE + 2}
          thickness={2.5}
          roundCaps
          sections={[
            {
              value: row.pagesTotal > 0 ? (row.pagesDone / row.pagesTotal) * 100 : 0,
              color: 'var(--mantine-primary-color-filled)',
            },
          ]}
        />
      );
    case DOWNLOAD_STATUS.FAILED:
      return (
        <WarningCircleIcon size={SIZE} weight="fill" color="var(--mantine-color-red-filled)" />
      );
    case DOWNLOAD_STATUS.QUEUED:
    case DOWNLOAD_STATUS.DONE:
      return <ClockIcon size={SIZE} color="var(--mantine-color-dimmed)" />;
  }
}

export default QueueStatusIcon;

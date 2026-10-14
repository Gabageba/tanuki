import type { MouseEvent } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { getDownloadErrorLabel } from '@/entities/download/lib';
import type { DownloadRow } from '@/entities/download/models';

type Props = {
  error: DownloadRow['error'];
  onRetry: (event: MouseEvent) => void;
};

/** «!» — скачивание упало; в подсказке причина, клик — повтор. */
function FailedDownloadButton({ error, onRetry }: Props) {
  const { t } = useTranslation();
  const reason = error && getDownloadErrorLabel(error, t);

  return (
    <Tooltip label={t('reasonClickToRetry', { reason })}>
      <ActionIcon variant="subtle" color="red" onClick={onRetry}>
        <WarningCircleIcon weight="fill" color="var(--mantine-color-red-filled)" />
      </ActionIcon>
    </Tooltip>
  );
}

export default FailedDownloadButton;

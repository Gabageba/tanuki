import type { MouseEvent } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { ClockIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onCancel: (event: MouseEvent) => void;
};

/** Часы — глава в очереди, клик отменяет. */
function QueuedDownloadButton({ onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Tooltip label={t('queuedClickToCancel')}>
      <ActionIcon variant="subtle" color="gray" onClick={onCancel}>
        <ClockIcon color="var(--mantine-color-dimmed)" />
      </ActionIcon>
    </Tooltip>
  );
}

export default QueuedDownloadButton;

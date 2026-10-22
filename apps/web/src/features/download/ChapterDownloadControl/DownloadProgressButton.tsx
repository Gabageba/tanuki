import type { MouseEvent } from 'react';
import { ActionIcon, Center, Group, RingProgress, Text, Tooltip } from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  pagesDone: number;
  pagesTotal: number;
  onCancel: (event: MouseEvent) => void;
};

/** Кольцо со счётчиком страниц — глава качается, клик отменяет. */
function DownloadProgressButton({ pagesDone, pagesTotal, onCancel }: Props) {
  const { t } = useTranslation();
  const progress = pagesTotal > 0 ? (pagesDone / pagesTotal) * 100 : 0;

  return (
    <Group gap={6} wrap="nowrap">
      {pagesTotal > 0 && (
        <Text fz={12} c="dimmed" ff="monospace">
          {pagesDone}/{pagesTotal}
        </Text>
      )}
      <Tooltip label={t('downloadingClickToCancel')}>
        <ActionIcon variant="subtle" color="gray" onClick={onCancel}>
          <RingProgress
            size={22}
            thickness={2.5}
            roundCaps
            sections={[{ value: progress, color: 'var(--mantine-primary-color-filled)' }]}
            label={
              <Center>
                <XIcon size={9} weight="bold" />
              </Center>
            }
          />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

export default DownloadProgressButton;

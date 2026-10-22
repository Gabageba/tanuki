import { Group, Text } from '@mantine/core';
import { WarningIcon } from '@phosphor-icons/react';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { formatChaptersCount, formatSize } from '../lib';
import { AVERAGE_CHAPTER_MB } from '../mocks';

type Props = {
  count: number;
  freeMb: number;
};

/** Строка объёма: сколько встанет в очередь, примерно сколько это места и сколько свободно. Не
 *  хватает места — строка золотая, но скачать можно: очередь встанет на паузу, когда место кончится. */
function DownloadSummary({ count, freeMb }: Props) {
  const neededMb = count * AVERAGE_CHAPTER_MB;
  const isTight = neededMb > freeMb;

  return (
    <Group gap={6} wrap="nowrap" align="flex-start">
      {isTight && (
        <WarningIcon
          size={16}
          color={`var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`}
          style={{ flex: 'none', marginTop: 2 }}
        />
      )}
      <Text fz="sm" c={isTight ? STATUS_DEGRADED_COLOR : undefined}>
        Будет скачано{' '}
        <Text span ff="monospace" fz="sm">
          {formatChaptersCount(count)}
        </Text>
        , примерно{' '}
        <Text span ff="monospace" fz="sm">
          {formatSize(neededMb)}
        </Text>
        . Свободно{' '}
        <Text span ff="monospace" fz="sm">
          {formatSize(freeMb)}
        </Text>
        {isTight && ' — может не хватить места'}
      </Text>
    </Group>
  );
}

export default DownloadSummary;

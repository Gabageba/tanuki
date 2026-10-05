import { Stack, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import { formatNightsInRow } from '../lib';
import type { MockSource } from '../models';

type Props = {
  source: MockSource;
};

/** Давность ночной проверки и, если она падает, сколько ночей подряд. Ни разу не проверялся
 *  (или выключен в каталоге — `broken`) — прочерк. */
function ProbeCell({ source }: Props) {
  const { formatRelative } = useDateFormat();

  if (!source.checkedAt) return <Mdash c="dimmed" fz="sm" />;

  return (
    <Stack gap={2}>
      <Text fz="sm">{formatRelative(source.checkedAt)}</Text>
      {source.failedProbeStreak > 0 && (
        <Text fz="xs" c="dimmed">
          {formatNightsInRow(source.failedProbeStreak)}
        </Text>
      )}
    </Stack>
  );
}

export default ProbeCell;

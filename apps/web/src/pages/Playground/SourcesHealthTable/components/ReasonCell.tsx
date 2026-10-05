import { Stack, Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import { getReasonLabel } from '../lib';
import type { MockSource } from '../models';

type Props = {
  source: MockSource;
};

/** T5: причина обычным цветом и под ней две строки ошибки — «что случилось» и «как именно».
 *  Ошибки нет (`broken`, `recovered`) — одна причина; нет ни того, ни другого — прочерк. */
function ReasonCell({ source }: Props) {
  if (!source.statusReason && !source.lastError) return <Mdash c="dimmed" fz="sm" />;

  return (
    <Stack gap={2} miw={0}>
      {source.statusReason && (
        <Text fz="xs" truncate>
          {getReasonLabel(source.statusReason)}
        </Text>
      )}
      {source.lastError && (
        <Text fz="xs" c="dimmed" ff="monospace" lineClamp={2} style={{ wordBreak: 'break-all' }}>
          {source.lastError}
        </Text>
      )}
    </Stack>
  );
}

export default ReasonCell;

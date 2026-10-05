import { Stack, Text } from '@mantine/core';
import { getReasonLabel } from '../lib';
import type { MockSource } from '../models';
import HealthStatusBadge from './HealthStatusBadge';
import StatusSince from './StatusSince';

type Props = {
  source: MockSource;
  /** T2: первая строка ошибки — третьей строкой, целиком она в карточке. */
  withError?: boolean;
  /** T5: причина переехала в свой столбец, к ошибке. */
  withReason?: boolean;
};

/** Бейдж, под ним «С 01.10.2026» и причина — как бейдж, срок и причина блокировки у
 *  пользователя. */
function HealthStatusCell({ source, withError = false, withReason = true }: Props) {
  return (
    <Stack gap={2} align="flex-start" miw={0} maw="100%">
      <HealthStatusBadge status={source.status} />
      <StatusSince statusChangedAt={source.statusChangedAt} />
      {withReason && source.statusReason && (
        <Text fz="xs" c="dimmed" truncate maw="100%">
          {getReasonLabel(source.statusReason)}
        </Text>
      )}
      {withError && source.lastError && (
        <Text fz="xs" c="dimmed" ff="monospace" truncate maw="100%" title={source.lastError}>
          {source.lastError}
        </Text>
      )}
    </Stack>
  );
}

export default HealthStatusCell;

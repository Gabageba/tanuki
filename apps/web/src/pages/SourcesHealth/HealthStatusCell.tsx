import { Stack } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import HealthStatusBadge from './HealthStatusBadge';
import StatusSince from './StatusSince';

type Props = {
  source: Source;
};

/** Бейдж и под ним «С 01.10.2026». Причина — в своём столбце, рядом с ошибкой. */
function HealthStatusCell({ source }: Props) {
  return (
    <Stack gap={2} align="flex-start">
      <HealthStatusBadge status={source.status} />
      <StatusSince statusChangedAt={source.statusChangedAt} />
    </Stack>
  );
}

export default HealthStatusCell;

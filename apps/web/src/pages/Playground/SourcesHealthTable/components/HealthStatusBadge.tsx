import { Badge } from '@mantine/core';
import type { SourceStatus } from '@tanuki/contracts';
import { getSourceStatusColor } from '@/entities/source/lib';
import { getStatusLabel } from '../lib';

type Props = {
  status: SourceStatus;
};

/** Статус бейджем `muted`, как у пользователей и приглашений, цвета — прежние цвета статуса. */
function HealthStatusBadge({ status }: Props) {
  return (
    <Badge color={getSourceStatusColor(status)} variant="muted">
      {getStatusLabel(status)}
    </Badge>
  );
}

export default HealthStatusBadge;

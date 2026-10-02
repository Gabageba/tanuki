import { Badge } from '@mantine/core';
import type { UserStatus } from '../models';
import { getStatusColor, getStatusLabel } from '../lib';

type Props = {
  status: UserStatus;
};

function StatusBadge({ status }: Props) {
  return (
    <Badge color={getStatusColor(status)} variant="light">
      {getStatusLabel(status)}
    </Badge>
  );
}

export default StatusBadge;

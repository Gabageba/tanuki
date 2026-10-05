import { Badge } from '@mantine/core';
import type { UserStatus } from '@tanuki/contracts';
import { getUserStatusColor, getUserStatusLabel } from '../lib';

type Props = {
  status: UserStatus;
};

/** Копия бейджа статуса из «Управления» — без i18n, как всё в песочнице. */
function UserStatusBadge({ status }: Props) {
  return (
    <Badge color={getUserStatusColor(status)} variant="muted">
      {getUserStatusLabel(status)}
    </Badge>
  );
}

export default UserStatusBadge;

import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { UserStatus } from '@tanuki/contracts';
import { getUserStatusColor, getUserStatusLabel } from './models';

type Props = {
  status: UserStatus;
};

function UserStatusBadge({ status }: Props) {
  const { t } = useTranslation();

  return (
    <Badge color={getUserStatusColor(status)} variant="muted">
      {getUserStatusLabel(status, t)}
    </Badge>
  );
}

export default UserStatusBadge;

import { Badge, type BadgeProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { UserRole } from '@tanuki/contracts';
import { getUserRoleColor, getUserRoleLabel } from '../../models';

type Props = {
  role: UserRole;
  size?: BadgeProps['size'];
};

function RoleBadge({ role, size }: Props) {
  const { t } = useTranslation();

  return (
    <Badge color={getUserRoleColor(role)} variant="muted" size={size} flex="none">
      {getUserRoleLabel(role, t)}
    </Badge>
  );
}

export default RoleBadge;

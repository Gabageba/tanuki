import { Badge, type BadgeProps } from '@mantine/core';
import type { UserRole } from '@tanuki/contracts';
import { getRoleColor, getRoleLabel } from '../lib';

type Props = {
  role: UserRole;
  size?: BadgeProps['size'];
};

function RoleBadge({ role, size }: Props) {
  return (
    <Badge color={getRoleColor(role)} variant="muted" size={size} flex="none">
      {getRoleLabel(role)}
    </Badge>
  );
}

export default RoleBadge;

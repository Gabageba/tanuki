import { Select } from '@mantine/core';
import { ShieldIcon } from '@phosphor-icons/react';
import { INVITABLE_ROLE, type InvitableRole, type UserRole } from '@tanuki/contracts';
import { getRoleLabel } from '../lib';

type Props = {
  role: UserRole;
  onChange: (role: UserRole) => void;
};

const ROLE_OPTIONS = Object.values(INVITABLE_ROLE).map((value) => ({
  value,
  label: getRoleLabel(value),
}));

const isInvitableRole = (value: string | null): value is InvitableRole =>
  ROLE_OPTIONS.some((option) => option.value === value);

/** A2: роль прямо в ячейке. Админа в списке нет — он один и выдаётся только CLI. */
function RoleSelect({ role, onChange }: Props) {
  return (
    <Select
      size="xs"
      w={170}
      data={ROLE_OPTIONS}
      value={role}
      allowDeselect={false}
      leftSection={<ShieldIcon />}
      onClick={(event) => event.stopPropagation()}
      onChange={(value) => isInvitableRole(value) && onChange(value)}
    />
  );
}

export default RoleSelect;

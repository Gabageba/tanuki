import { Flex } from '@mantine/core';
import { CircleHalfIcon, ShieldIcon } from '@phosphor-icons/react';
import { INVITE_STATUS, USER_ROLE, type InviteStatus, type UserRole } from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getInviteStatusFilterLabel, getRoleLabel } from '../lib';

type Props = {
  status: InviteStatus[];
  role: UserRole[];
  onStatusChange: (status: InviteStatus[]) => void;
  onRoleChange: (role: UserRole[]) => void;
  /** Рамка телефона: списки друг под другом, как на узком экране. */
  narrow?: boolean;
};

const isStatus = (value: string): value is InviteStatus =>
  Object.values(INVITE_STATUS).some((status) => status === value);

const isRole = (value: string): value is UserRole =>
  Object.values(USER_ROLE).some((role) => role === value);

/** Как у пользователей, но без поиска: статус и роль, ничего не выбрано — без ограничения. */
function InvitesFilters({ status, role, onStatusChange, onRoleChange, narrow = false }: Props) {
  return (
    <Flex gap="xs" direction={narrow ? 'column' : { base: 'column', xs: 'row' }}>
      <CompactMultiSelect
        w={narrow ? undefined : { xs: 260 }}
        data={Object.values(INVITE_STATUS).map((value) => ({
          value,
          label: getInviteStatusFilterLabel(value),
        }))}
        value={status}
        placeholder={status.length ? undefined : 'Все статусы'}
        clearable
        leftSection={<CircleHalfIcon />}
        onChange={(values) => onStatusChange(values.filter(isStatus))}
      />
      <CompactMultiSelect
        w={narrow ? undefined : { xs: 220 }}
        data={Object.values(USER_ROLE).map((value) => ({
          value,
          label: getRoleLabel(value),
        }))}
        value={role}
        placeholder={role.length ? undefined : 'Все роли'}
        clearable
        leftSection={<ShieldIcon />}
        onChange={(values) => onRoleChange(values.filter(isRole))}
      />
    </Flex>
  );
}

export default InvitesFilters;

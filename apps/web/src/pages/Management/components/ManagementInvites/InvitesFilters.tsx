import { Flex } from '@mantine/core';
import { CircleHalfIcon, ShieldIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { INVITE_STATUS, USER_ROLE, type InviteStatus, type UserRole } from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getUserRoleLabel } from '@/entities/user/lib';
import { getInviteStatusFilterLabel } from './models';

type Props = {
  status: InviteStatus[];
  role: UserRole[];
  onStatusChange: (status: InviteStatus[]) => void;
  onRoleChange: (role: UserRole[]) => void;
};

const isStatus = (value: string): value is InviteStatus =>
  Object.values(INVITE_STATUS).some((status) => status === value);

const isRole = (value: string): value is UserRole =>
  Object.values(USER_ROLE).some((role) => role === value);

/** Как у пользователей, но без поиска: статус и роль. Ничего не выбрано — без ограничения. На
 *  телефоне списки друг под другом. */
function InvitesFilters({ status, role, onStatusChange, onRoleChange }: Props) {
  const { t } = useTranslation();

  return (
    <Flex gap="xs" direction={{ base: 'column', xs: 'row' }}>
      <CompactMultiSelect
        w={{ xs: 260 }}
        data={Object.values(INVITE_STATUS).map((value) => ({
          value,
          label: getInviteStatusFilterLabel(value, t),
        }))}
        value={status}
        placeholder={t('allStatuses')}
        clearable
        leftSection={<CircleHalfIcon />}
        onChange={(values) => onStatusChange(values.filter(isStatus))}
      />
      <CompactMultiSelect
        w={{ xs: 220 }}
        data={Object.values(USER_ROLE).map((value) => ({
          value,
          label: getUserRoleLabel(value, t),
        }))}
        value={role}
        placeholder={t('allRoles')}
        clearable
        leftSection={<ShieldIcon />}
        onChange={(values) => onRoleChange(values.filter(isRole))}
      />
    </Flex>
  );
}

export default InvitesFilters;

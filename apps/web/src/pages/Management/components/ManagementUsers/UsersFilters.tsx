import { Flex, Group, TextInput } from '@mantine/core';
import { CircleHalfIcon, MagnifyingGlassIcon, ShieldIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { USER_ROLE, USER_STATUS, type UserRole, type UserStatus } from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getUserRoleLabel } from '../../models';
import { getUserStatusFilterLabel } from './models';

type Props = {
  query: string;
  role: UserRole[];
  status: UserStatus[];
  onQueryChange: (query: string) => void;
  onRoleChange: (role: UserRole[]) => void;
  onStatusChange: (status: UserStatus[]) => void;
};

const isRole = (value: string): value is UserRole =>
  Object.values(USER_ROLE).some((role) => role === value);

const isStatus = (value: string): value is UserStatus =>
  Object.values(USER_STATUS).some((status) => status === value);

/** Поиск по имени и почте и два списка с выбором нескольких: роли и статусы. Ничего не выбрано —
 *  без ограничения. На телефоне списки уходят под поиск. */
function UsersFilters({ query, role, status, onQueryChange, onRoleChange, onStatusChange }: Props) {
  const { t } = useTranslation();

  return (
    <Flex gap="xs" direction={{ base: 'column', sm: 'row' }}>
      <TextInput
        flex={1}
        miw={{ sm: 240 }}
        placeholder={t('nameOrEmail')}
        leftSection={<MagnifyingGlassIcon />}
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
      />
      <Group gap="xs" grow wrap="nowrap">
        <CompactMultiSelect
          w={{ sm: 220 }}
          data={Object.values(USER_ROLE).map((value) => ({
            value,
            label: getUserRoleLabel(value, t),
          }))}
          value={role}
          placeholder={role.length ? undefined : t('allRoles')}
          clearable
          leftSection={<ShieldIcon />}
          onChange={(values) => onRoleChange(values.filter(isRole))}
        />
        <CompactMultiSelect
          w={{ sm: 260 }}
          data={Object.values(USER_STATUS).map((value) => ({
            value,
            label: getUserStatusFilterLabel(value, t),
          }))}
          value={status}
          placeholder={status.length ? undefined : t('allStatuses')}
          clearable
          leftSection={<CircleHalfIcon />}
          onChange={(values) => onStatusChange(values.filter(isStatus))}
        />
      </Group>
    </Flex>
  );
}

export default UsersFilters;

import { Group, ScrollArea, SegmentedControl, Select, Stack, TextInput } from '@mantine/core';
import { CircleHalfIcon, MagnifyingGlassIcon, ShieldIcon } from '@phosphor-icons/react';
import { USER_ROLE, type UserRole } from '@tanuki/contracts';
import { getRoleLabel, getStatusFilterLabel } from '../lib';
import {
  FILTER_ALL,
  FILTERS_LAYOUT,
  USER_STATUS,
  type FiltersLayout,
  type RoleFilter,
  type StatusFilter,
  type UserStatus,
} from '../models';

type Props = {
  layout: FiltersLayout;
  narrow: boolean;
  query: string;
  role: RoleFilter;
  status: StatusFilter;
  onQueryChange: (query: string) => void;
  onRoleChange: (role: RoleFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
};

const ROLE_OPTIONS = [
  { value: FILTER_ALL, label: 'Все роли' },
  ...Object.values(USER_ROLE).map((value) => ({ value, label: getRoleLabel(value) })),
];

const STATUS_OPTIONS = Object.values(USER_STATUS).map((value) => ({
  value,
  label: getStatusFilterLabel(value),
}));

const isRole = (value: string | null): value is UserRole =>
  Object.values(USER_ROLE).some((role) => role === value);

const isStatus = (value: string | null): value is UserStatus =>
  Object.values(USER_STATUS).some((status) => status === value);

const toRoleFilter = (value: string | null): RoleFilter => (isRole(value) ? value : FILTER_ALL);

const toStatusFilter = (value: string | null): StatusFilter =>
  isStatus(value) ? value : FILTER_ALL;

function UsersFilters({
  layout,
  narrow,
  query,
  role,
  status,
  onQueryChange,
  onRoleChange,
  onStatusChange,
}: Props) {
  const search = (
    <TextInput
      flex={1}
      miw={narrow ? undefined : 240}
      placeholder="Имя или почта"
      leftSection={<MagnifyingGlassIcon />}
      value={query}
      onChange={(event) => onQueryChange(event.currentTarget.value)}
    />
  );
  const roleSelect = (
    <Select
      w={narrow ? undefined : 190}
      data={ROLE_OPTIONS}
      value={role}
      allowDeselect={false}
      leftSection={<ShieldIcon />}
      onChange={(value) => onRoleChange(toRoleFilter(value))}
    />
  );

  if (layout === FILTERS_LAYOUT.SELECTS) {
    const statusSelect = (
      <Select
        w={narrow ? undefined : 220}
        data={[{ value: FILTER_ALL, label: 'Все статусы' }, ...STATUS_OPTIONS]}
        value={status}
        allowDeselect={false}
        leftSection={<CircleHalfIcon />}
        onChange={(value) => onStatusChange(toStatusFilter(value))}
      />
    );

    return narrow ? (
      <Stack gap="xs">
        {search}
        <Group gap="xs" grow>
          {roleSelect}
          {statusSelect}
        </Group>
      </Stack>
    ) : (
      <Group gap="xs">
        {search}
        {roleSelect}
        {statusSelect}
      </Group>
    );
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" grow={narrow}>
        {search}
        {roleSelect}
      </Group>
      <ScrollArea type="never">
        <SegmentedControl
          value={status}
          onChange={(value) => onStatusChange(toStatusFilter(value))}
          data={[{ value: FILTER_ALL, label: 'Все' }, ...STATUS_OPTIONS]}
        />
      </ScrollArea>
    </Stack>
  );
}

export default UsersFilters;

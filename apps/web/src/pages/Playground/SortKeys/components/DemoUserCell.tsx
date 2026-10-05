import { Avatar, Badge, Group, Stack, Text } from '@mantine/core';
import { USER_ROLE, type ManagedUser } from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import RoleBadge from '../../InvitesTable/components/RoleBadge';
import type { ValueProps } from '../models';

type Props = {
  user: ManagedUser;
  isSelf: boolean;
  nameProps: ValueProps;
  emailProps: ValueProps;
};

/** Копия `UserCell` из «Управления», у которой имя и почту можно выделить по отдельности. */
function DemoUserCell({ user, isSelf, nameProps, emailProps }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0}>
      <Avatar
        src={user.avatarUrl}
        name={user.username}
        color={PRIMARY_COLOR}
        variant="outline"
        size={32}
      />
      <Stack gap={0} miw={0}>
        <Group gap={6} wrap="nowrap" miw={0}>
          <Text fz="sm" fw={500} truncate {...nameProps}>
            {user.username}
          </Text>
          {user.role !== USER_ROLE.USER && <RoleBadge role={user.role} size="xs" />}
          {isSelf && (
            <Badge size="xs" variant="muted" color="gray" flex="none">
              Вы
            </Badge>
          )}
        </Group>
        <Text fz="xs" c="dimmed" ff="monospace" truncate {...emailProps}>
          {user.email}
        </Text>
      </Stack>
    </Group>
  );
}

export default DemoUserCell;

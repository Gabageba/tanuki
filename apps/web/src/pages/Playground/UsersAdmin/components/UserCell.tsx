import { Avatar, Badge, Group, Stack, Text } from '@mantine/core';
import { USER_ROLE } from '@tanuki/contracts';
import type { MockUser } from '../models';
import RoleBadge from './RoleBadge';

type Props = {
  user: MockUser;
  isSelf: boolean;
  /** Почта второй строкой под именем; без неё — только имя. */
  withEmail?: boolean;
  /** T3: роль персонала — бейджем у имени; у обычных пользователей бейджа нет. */
  withRole?: boolean;
};

function UserCell({ user, isSelf, withEmail = true, withRole = false }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0}>
      <Avatar name={user.username} color="initials" size={32} />
      <Stack gap={0} miw={0}>
        <Group gap={6} wrap="nowrap" miw={0}>
          <Text fz="sm" fw={500} truncate>
            {user.username}
          </Text>
          {withRole && user.role !== USER_ROLE.USER && <RoleBadge role={user.role} size="xs" />}
          {isSelf && (
            <Badge size="xs" variant="light" color="gray" flex="none">
              Вы
            </Badge>
          )}
        </Group>
        {withEmail && (
          <Text fz="xs" c="dimmed" ff="monospace" truncate>
            {user.email}
          </Text>
        )}
      </Stack>
    </Group>
  );
}

export default UserCell;

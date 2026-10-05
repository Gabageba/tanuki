import { Avatar, Badge, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { USER_ROLE, type ManagedUser } from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import RoleBadge from '../RoleBadge';

type Props = {
  user: ManagedUser;
  isSelf: boolean;
  /** Роль персонала — бейджем у имени; у обычных пользователей бейджа нет. */
  withRole?: boolean;
};

/** Аватар, имя и почта второй строкой. */
function UserCell({ user, isSelf, withRole = false }: Props) {
  const { t } = useTranslation();

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
          <Text fz="sm" fw={500} truncate>
            {user.username}
          </Text>
          {withRole && user.role !== USER_ROLE.USER && <RoleBadge role={user.role} size="xs" />}
          {isSelf && (
            <Badge size="xs" variant="muted" color="gray" flex="none">
              {t('you')}
            </Badge>
          )}
        </Group>
        <Text fz="xs" c="dimmed" ff="monospace" truncate>
          {user.email}
        </Text>
      </Stack>
    </Group>
  );
}

export default UserCell;

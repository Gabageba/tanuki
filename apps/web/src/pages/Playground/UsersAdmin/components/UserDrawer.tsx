import { Avatar, Button, Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import {
  LockOpenIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { USER_ROLE } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import { getPermissions, hasAnyPermission } from '../lib';
import { USER_STATUS, type MockUser, type RowHandlers, type StaffRole } from '../models';
import DrawerField from './DrawerField';
import LastSeen from './LastSeen';
import RoleBadge from './RoleBadge';
import StatusBadge from './StatusBadge';
import StatusTerm from './StatusTerm';

type Props = {
  user: MockUser | null;
  viewer: StaffRole;
  selfId: string;
  /** На телефоне drawer выезжает снизу, а не сбоку. */
  narrow: boolean;
  onClose: () => void;
  handlers: RowHandlers;
};

/** A3: карточка пользователя — все поля целиком и действия кнопками внизу. */
function UserDrawer({ user, viewer, selfId, narrow, onClose, handlers }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const permissions = user ? getPermissions(viewer, selfId, user) : null;

  return (
    <Drawer
      opened={user !== null}
      onClose={onClose}
      position={narrow ? 'bottom' : 'right'}
      size={narrow ? 'auto' : 420}
      title="Пользователь"
    >
      {user && permissions && (
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <Avatar name={user.username} color="initials" size={48} />
            <Stack gap={0} miw={0}>
              <Text fw={600} truncate>
                {user.username}
                {user.id === selfId && ' (вы)'}
              </Text>
              <Text fz="sm" c="dimmed" ff="monospace" truncate>
                {user.email}
              </Text>
            </Stack>
          </Group>

          <Divider />

          <Stack gap="sm">
            <DrawerField label="Роль">
              <RoleBadge role={user.role} />
            </DrawerField>
            <DrawerField label="Статус">
              <StatusBadge status={user.status} />
              <StatusTerm user={user} />
            </DrawerField>
            {user.status === USER_STATUS.BLOCKED && (
              <DrawerField label="Причина">
                {user.blockReason ? <Text fz="sm">{user.blockReason}</Text> : <Mdash c="dimmed" />}
              </DrawerField>
            )}
            <DrawerField label="Пригласил">
              {user.invitedBy ? <Text fz="sm">{user.invitedBy}</Text> : <Mdash c="dimmed" />}
            </DrawerField>
            <DrawerField label="Регистрация">
              <Text fz="sm" ff="monospace">
                {formatDateNumeric(user.createdAt)}
              </Text>
            </DrawerField>
            <DrawerField label="Вход">
              <LastSeen lastSeenAt={user.lastSeenAt} />
            </DrawerField>
          </Stack>

          {hasAnyPermission(permissions) && (
            <>
              <Divider />
              <Stack gap="xs">
                {permissions.canChangeRole &&
                  (user.role === USER_ROLE.MODERATOR ? (
                    <Button
                      variant="default"
                      leftSection={<ShieldSlashIcon />}
                      onClick={() => handlers.onRoleChange(user, USER_ROLE.USER)}
                    >
                      Снять модератора
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      leftSection={<ShieldCheckIcon />}
                      onClick={() => handlers.onRoleChange(user, USER_ROLE.MODERATOR)}
                    >
                      Сделать модератором
                    </Button>
                  ))}
                {permissions.canBlock &&
                  (user.status === USER_STATUS.BLOCKED ? (
                    <Button
                      variant="default"
                      leftSection={<LockOpenIcon />}
                      onClick={() => handlers.onUnblock(user)}
                    >
                      Разблокировать
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      leftSection={<ProhibitIcon />}
                      onClick={() => handlers.onBlock(user)}
                    >
                      Заблокировать
                    </Button>
                  ))}
                {permissions.canDelete && (
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<TrashIcon />}
                    onClick={() => handlers.onDelete(user)}
                  >
                    Удалить
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Stack>
      )}
    </Drawer>
  );
}

export default UserDrawer;

import { Avatar, Badge, Button, Divider, Stack, Text } from '@mantine/core';
import {
  LockOpenIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  USER_ROLE,
  USER_STATUS,
  type ManagedUser,
  type UserManagementPermissions,
} from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import DrawerField from '@/shared/ui/DrawerField';
import EntityHeading from '@/shared/ui/EntityHeading';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION } from '@/shared/ui/ResponsiveDrawer/models';
import LastSeen from './LastSeen';
import RoleBadge from '@/entities/user/components/RoleBadge';
import UserStatusBadge from './UserStatusBadge';
import UserStatusTerm from './UserStatusTerm';
import type { UserHandlers } from './models';

type Props = {
  user: ManagedUser | null;
  isSelf: boolean;
  permissions: UserManagementPermissions | null;
  /** Смена роли и разблокировка идут сразу, без модалки, — крутилка на самой кнопке. */
  isRoleChanging: boolean;
  isUnblocking: boolean;
  handlers: UserHandlers;
  onClose: () => void;
};

/** Карточка пользователя: в заголовке аватар, имя и почта, ниже все поля целиком и действия
 *  кнопками внизу. Справа, на телефоне — снизу. */
function UserDrawer({
  user,
  isSelf,
  permissions,
  isRoleChanging,
  isUnblocking,
  handlers,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();

  const hasActions =
    permissions !== null &&
    (permissions.canChangeRole || permissions.canBlock || permissions.canDelete);

  return (
    <ResponsiveDrawer
      opened={user !== null}
      onClose={onClose}
      side={DRAWER_POSITION.RIGHT}
      sideSize={420}
      title={
        user ? (
          <EntityHeading
            icon={
              <Avatar
                src={user.avatarUrl}
                name={user.username}
                color={PRIMARY_COLOR}
                variant="outline"
                size={40}
              />
            }
            title={user.username}
            badge={
              isSelf && (
                <Badge size="xs" variant="muted" color="gray" flex="none">
                  {t('you')}
                </Badge>
              )
            }
            subtitle={user.email}
          />
        ) : (
          t('user')
        )
      }
    >
      {user && (
        <Stack gap="md">
          <Stack gap="sm">
            <DrawerField label={t('role')}>
              <RoleBadge role={user.role} />
            </DrawerField>
            <DrawerField label={t('status')}>
              <UserStatusBadge status={user.status} />
              <UserStatusTerm user={user} />
            </DrawerField>
            {user.status === USER_STATUS.BLOCKED && (
              <DrawerField label={t('reason')}>
                {user.blockReason ? <Text fz="sm">{user.blockReason}</Text> : <Mdash c="dimmed" />}
              </DrawerField>
            )}
            <DrawerField label={t('invitedBy')}>
              {user.invitedByUsername ? (
                <Text fz="sm">{user.invitedByUsername}</Text>
              ) : (
                <Mdash c="dimmed" />
              )}
            </DrawerField>
            <DrawerField label={t('registration')}>
              <Text fz="sm" ff="monospace">
                {formatDateNumeric(user.createdAt)}
              </Text>
            </DrawerField>
            <DrawerField label={t('login')}>
              <LastSeen lastSeenAt={user.lastSeenAt} />
            </DrawerField>
          </Stack>

          {hasActions && (
            <>
              <Divider />
              <Stack gap="xs">
                {permissions.canChangeRole &&
                  (user.role === USER_ROLE.MODERATOR ? (
                    <Button
                      variant="default"
                      leftSection={<ShieldSlashIcon />}
                      loading={isRoleChanging}
                      onClick={() => handlers.onRoleChange(user, USER_ROLE.USER)}
                    >
                      {t('removeModerator')}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      leftSection={<ShieldCheckIcon />}
                      loading={isRoleChanging}
                      onClick={() => handlers.onRoleChange(user, USER_ROLE.MODERATOR)}
                    >
                      {t('makeModerator')}
                    </Button>
                  ))}
                {permissions.canBlock &&
                  (user.status === USER_STATUS.BLOCKED ? (
                    <Button
                      variant="default"
                      leftSection={<LockOpenIcon />}
                      loading={isUnblocking}
                      onClick={() => handlers.onUnblock(user)}
                    >
                      {t('unblock')}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      leftSection={<ProhibitIcon />}
                      onClick={() => handlers.onBlock(user)}
                    >
                      {t('block')}
                    </Button>
                  ))}
                {permissions.canDelete && (
                  <Button
                    variant="muted"
                    color="red"
                    leftSection={<TrashIcon />}
                    onClick={() => handlers.onDelete(user)}
                  >
                    {t('delete')}
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Stack>
      )}
    </ResponsiveDrawer>
  );
}

export default UserDrawer;

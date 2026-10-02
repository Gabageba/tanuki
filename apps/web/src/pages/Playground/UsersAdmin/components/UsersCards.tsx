import { Divider, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { Fragment } from 'react';
import useDateFormat from '@/shared/hooks/useDateFormat';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import { getPermissions } from '../lib';
import {
  ACTIONS_MODE,
  type ActionsMode,
  type MockUser,
  type RowHandlers,
  type StaffRole,
} from '../models';
import RoleCell from './RoleCell';
import StatusBadge from './StatusBadge';
import StatusTerm from './StatusTerm';
import UserCell from './UserCell';
import UserRowActions from './UserRowActions';

type Props = {
  users: MockUser[];
  mode: ActionsMode;
  viewer: StaffRole;
  selfId: string;
  handlers: RowHandlers;
};

/** M2: на телефоне строка таблицы превращается в карточку — кто, роль со статусом, даты. */
function UsersCards({ users, mode, viewer, selfId, handlers }: Props) {
  const { formatDateNumeric, formatRelative } = useDateFormat();
  const isClickable = mode === ACTIONS_MODE.DRAWER;

  return (
    <Paper withBorder radius="md">
      {users.map((user, index) => {
        const permissions = getPermissions(viewer, selfId, user);
        const content = (
          <Group gap="xs" wrap="nowrap" align="flex-start" p="sm">
            <Stack gap={6} flex={1} miw={0}>
              <UserCell user={user} isSelf={user.id === selfId} />
              <Group gap={6}>
                <RoleCell user={user} permissions={permissions} mode={mode} handlers={handlers} />
                <StatusBadge status={user.status} />
              </Group>
              <StatusTerm user={user} />
              {user.blockReason && (
                <Text fz="xs" c="dimmed" lineClamp={2}>
                  {user.blockReason}
                </Text>
              )}
              <MidDotGroup
                text={{ fz: 'xs', c: 'dimmed' }}
                items={[
                  <>
                    Регистрация{' '}
                    <Text span inherit ff="monospace">
                      {formatDateNumeric(user.createdAt)}
                    </Text>
                  </>,
                  user.lastSeenAt ? `вход ${formatRelative(user.lastSeenAt)}` : 'входа не было',
                ]}
              />
            </Stack>
            <UserRowActions user={user} permissions={permissions} mode={mode} handlers={handlers} />
          </Group>
        );

        return (
          <Fragment key={user.id}>
            {index > 0 && <Divider />}
            {isClickable ? (
              <UnstyledButton w="100%" onClick={() => handlers.onOpen(user)}>
                {content}
              </UnstyledButton>
            ) : (
              content
            )}
          </Fragment>
        );
      })}
    </Paper>
  );
}

export default UsersCards;

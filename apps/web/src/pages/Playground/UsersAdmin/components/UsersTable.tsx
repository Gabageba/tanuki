import { Stack, Table, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import { getPermissions } from '../lib';
import {
  ACTIONS_MODE,
  TABLE_LAYOUT,
  type ActionsMode,
  type MockUser,
  type RowHandlers,
  type StaffRole,
  type TableLayout,
} from '../models';
import DatesCell from './DatesCell';
import LastSeen from './LastSeen';
import RoleCell from './RoleCell';
import StatusCell from './StatusCell';
import UserCell from './UserCell';
import UserRowActions from './UserRowActions';

type Props = {
  users: MockUser[];
  layout: TableLayout;
  mode: ActionsMode;
  viewer: StaffRole;
  selfId: string;
  handlers: RowHandlers;
};

const getMinWidth = (layout: TableLayout) => {
  switch (layout) {
    case TABLE_LAYOUT.SEPARATE:
      return 1180;
    case TABLE_LAYOUT.MERGED:
      return 900;
    case TABLE_LAYOUT.COMPACT:
      return 640;
    case TABLE_LAYOUT.ROLE_IN_USER:
      return 760;
  }
};

const getHeaders = (layout: TableLayout) => {
  switch (layout) {
    case TABLE_LAYOUT.SEPARATE:
      return ['Имя', 'Почта', 'Роль', 'Статус', 'Причина', 'Пригласил', 'Регистрация', 'Вход'];
    case TABLE_LAYOUT.MERGED:
      return ['Пользователь', 'Роль', 'Статус', 'Пригласил', 'Регистрация', 'Вход'];
    case TABLE_LAYOUT.COMPACT:
      return ['Пользователь', 'Роль и статус', 'Даты'];
    case TABLE_LAYOUT.ROLE_IN_USER:
      return ['Пользователь', 'Статус', 'Пригласил', 'Даты'];
  }
};

function UsersTable({ users, layout, mode, viewer, selfId, handlers }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const isClickable = mode === ACTIONS_MODE.DRAWER;

  return (
    <Table.ScrollContainer minWidth={getMinWidth(layout)}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {getHeaders(layout).map((header, index) => (
              <Table.Th key={index}>{header}</Table.Th>
            ))}
            {!isClickable && <Table.Th w={48} />}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => {
            const isSelf = user.id === selfId;
            const permissions = getPermissions(viewer, selfId, user);
            const registered = (
              <Text fz="sm" ff="monospace">
                {formatDateNumeric(user.createdAt)}
              </Text>
            );
            const invitedBy = user.invitedBy ? (
              <Text fz="sm">{user.invitedBy}</Text>
            ) : (
              <Mdash c="dimmed" />
            );
            const roleCell = (
              <RoleCell user={user} permissions={permissions} mode={mode} handlers={handlers} />
            );

            return (
              <Table.Tr
                key={user.id}
                onClick={isClickable ? () => handlers.onOpen(user) : undefined}
                style={isClickable ? { cursor: 'pointer' } : undefined}
              >
                {layout === TABLE_LAYOUT.SEPARATE && (
                  <>
                    <Table.Td>
                      <UserCell user={user} isSelf={isSelf} withEmail={false} />
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" ff="monospace">
                        {user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>{roleCell}</Table.Td>
                    <Table.Td>
                      <StatusCell user={user} withReasonLine={false} />
                    </Table.Td>
                    <Table.Td maw={220}>
                      {user.blockReason ? (
                        <Text fz="sm" lineClamp={2}>
                          {user.blockReason}
                        </Text>
                      ) : (
                        <Mdash c="dimmed" />
                      )}
                    </Table.Td>
                    <Table.Td>{invitedBy}</Table.Td>
                    <Table.Td>{registered}</Table.Td>
                    <Table.Td>
                      <LastSeen lastSeenAt={user.lastSeenAt} />
                    </Table.Td>
                  </>
                )}

                {layout === TABLE_LAYOUT.MERGED && (
                  <>
                    <Table.Td maw={280}>
                      <UserCell user={user} isSelf={isSelf} />
                    </Table.Td>
                    <Table.Td>{roleCell}</Table.Td>
                    <Table.Td>
                      <StatusCell user={user} withReasonLine />
                    </Table.Td>
                    <Table.Td>{invitedBy}</Table.Td>
                    <Table.Td>{registered}</Table.Td>
                    <Table.Td>
                      <LastSeen lastSeenAt={user.lastSeenAt} />
                    </Table.Td>
                  </>
                )}

                {layout === TABLE_LAYOUT.COMPACT && (
                  <>
                    <Table.Td maw={280}>
                      <UserCell user={user} isSelf={isSelf} />
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={4} align="flex-start">
                        {roleCell}
                        <StatusCell user={user} withReasonLine={false} />
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <DatesCell user={user} />
                    </Table.Td>
                  </>
                )}

                {layout === TABLE_LAYOUT.ROLE_IN_USER && (
                  <>
                    <Table.Td maw={300}>
                      <UserCell user={user} isSelf={isSelf} withRole />
                    </Table.Td>
                    <Table.Td>
                      <StatusCell user={user} withReasonLine />
                    </Table.Td>
                    <Table.Td>{invitedBy}</Table.Td>
                    <Table.Td>
                      <DatesCell user={user} />
                    </Table.Td>
                  </>
                )}

                {!isClickable && (
                  <Table.Td>
                    <UserRowActions
                      user={user}
                      permissions={permissions}
                      mode={mode}
                      handlers={handlers}
                    />
                  </Table.Td>
                )}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default UsersTable;

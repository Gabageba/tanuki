import { Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  MANAGED_USERS_SORT,
  type ManagedUser,
  type ManagedUsersSort,
  type SortDirection,
} from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';
import type { UserHandlers } from './models';
import SortableTh from '../SortableTh';
import UserCell from './UserCell';
import UserDatesCell from './UserDatesCell';
import UserStatusCell from './UserStatusCell';

type Props = {
  users: ManagedUser[];
  selfId: string | undefined;
  sort: ManagedUsersSort;
  direction: SortDirection;
  onSortChange: (sort: ManagedUsersSort) => void;
  onOpen: UserHandlers['onOpen'];
};

/** Кнопок в строках нет: клик по строке открывает карточку пользователя с действиями. На
 *  телефоне та же таблица листается вбок. */
function UsersTable({ users, selfId, sort, direction, onSortChange, onOpen }: Props) {
  const sortProps = { activeSort: sort, direction, onSortChange };

  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh sort={MANAGED_USERS_SORT.USERNAME} {...sortProps}>
              {t('user')}
            </SortableTh>
            <SortableTh sort={MANAGED_USERS_SORT.STATUS} {...sortProps}>
              {t('status')}
            </SortableTh>
            <SortableTh sort={MANAGED_USERS_SORT.INVITED_BY} {...sortProps}>
              {t('invitedBy')}
            </SortableTh>
            {/* По дате регистрации: последний вход в том же столбце не сортируется. */}
            <SortableTh sort={MANAGED_USERS_SORT.CREATED_AT} {...sortProps}>
              {t('dates')}
            </SortableTh>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.id} onClick={() => onOpen(user)} style={{ cursor: 'pointer' }}>
              <Table.Td maw={300}>
                <UserCell user={user} isSelf={user.id === selfId} withRole />
              </Table.Td>
              <Table.Td>
                <UserStatusCell user={user} />
              </Table.Td>
              <Table.Td>
                {user.invitedByUsername ? (
                  <Text fz="sm">{user.invitedByUsername}</Text>
                ) : (
                  <Mdash c="dimmed" />
                )}
              </Table.Td>
              <Table.Td>
                <UserDatesCell user={user} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default UsersTable;

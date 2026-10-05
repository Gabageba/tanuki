import { Table, Text } from '@mantine/core';
import {
  CalendarPlusIcon,
  EnvelopeSimpleIcon,
  HourglassIcon,
  SignInIcon,
  TagIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  MANAGED_USERS_SORT,
  type ManagedUser,
  type ManagedUsersSort,
  type SortDirection,
} from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';
import { USERS_COLUMN_WIDTH, type UserHandlers } from './models';
import SortableTh from '../SortableTh';
import SortMenuTh from '../SortMenuTh';
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
      <Table layout="fixed" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortMenuTh
              title={t('user')}
              w={USERS_COLUMN_WIDTH.USER}
              options={[
                {
                  sort: MANAGED_USERS_SORT.USERNAME,
                  label: t('name'),
                  menuLabel: t('byName'),
                  icon: <UserIcon />,
                },
                {
                  sort: MANAGED_USERS_SORT.EMAIL,
                  label: t('email'),
                  menuLabel: t('byEmail'),
                  icon: <EnvelopeSimpleIcon />,
                },
              ]}
              {...sortProps}
            />
            <SortMenuTh
              title={t('status')}
              w={USERS_COLUMN_WIDTH.STATUS}
              options={[
                {
                  sort: MANAGED_USERS_SORT.STATUS,
                  label: t('status'),
                  menuLabel: t('byStatus'),
                  icon: <TagIcon />,
                },
                {
                  sort: MANAGED_USERS_SORT.STATUS_UNTIL,
                  label: t('period'),
                  menuLabel: t('byPeriod'),
                  icon: <HourglassIcon />,
                },
              ]}
              {...sortProps}
            />
            <SortableTh
              sort={MANAGED_USERS_SORT.INVITED_BY}
              w={USERS_COLUMN_WIDTH.INVITED_BY}
              {...sortProps}
            >
              {t('invitedBy')}
            </SortableTh>
            <SortMenuTh
              title={t('dates')}
              w={USERS_COLUMN_WIDTH.DATES}
              options={[
                {
                  sort: MANAGED_USERS_SORT.CREATED_AT,
                  label: t('registration'),
                  menuLabel: t('byRegistration'),
                  icon: <CalendarPlusIcon />,
                },
                {
                  sort: MANAGED_USERS_SORT.LAST_SEEN_AT,
                  label: t('login'),
                  menuLabel: t('byLogin'),
                  icon: <SignInIcon />,
                },
              ]}
              {...sortProps}
            />
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

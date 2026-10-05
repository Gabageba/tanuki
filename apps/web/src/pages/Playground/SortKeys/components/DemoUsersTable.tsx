import { Table, Text } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';
import { USER_COLUMNS } from '../columns';
import useSortState from '../hooks/useSortState';
import { getColumnBackground, getSortMark, getSortValueProps, sortUsers } from '../lib';
import { MOCK_USERS } from '../mocks';
import {
  SORT_MARK,
  USER_SORT_KEY,
  type SortColumn,
  type SortHighlight,
  type SortPicker,
  type UserSortKey,
} from '../models';
import DemoDatesCell from './DemoDatesCell';
import DemoStatusCell from './DemoStatusCell';
import DemoUserCell from './DemoUserCell';
import SortHeader from './SortHeader';

type Props = {
  picker: SortPicker;
  highlight: SortHighlight;
};

const [USER_COLUMN, STATUS_COLUMN, INVITED_BY_COLUMN, DATES_COLUMN] = USER_COLUMNS as [
  SortColumn<UserSortKey>,
  SortColumn<UserSortKey>,
  SortColumn<UserSortKey>,
  SortColumn<UserSortKey>,
];

/** Вкладка «Пользователи» в раскладке T3; по умолчанию — по регистрации, новые сверху, как в
 *  приложении. */
function DemoUsersTable({ picker, highlight }: Props) {
  const { sort, changeSort } = useSortState<UserSortKey>({
    key: USER_SORT_KEY.CREATED_AT,
    direction: SORT_DIRECTION.DESC,
  });
  const users = sortUsers(MOCK_USERS, sort);

  const valueProps = (column: SortColumn<UserSortKey>, key: UserSortKey) =>
    getSortValueProps(highlight, getSortMark(column, key, sort));
  const columnBackground = (column: SortColumn<UserSortKey>) =>
    getColumnBackground(highlight, getSortMark(column, sort.key, sort) !== SORT_MARK.IDLE);

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {USER_COLUMNS.map((column) => (
              <SortHeader
                key={column.id}
                column={column}
                picker={picker}
                highlight={highlight}
                sort={sort}
                onSortChange={changeSort}
              />
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td maw={300} bg={columnBackground(USER_COLUMN)}>
                <DemoUserCell
                  user={user}
                  isSelf={user.id === 'u1'}
                  nameProps={valueProps(USER_COLUMN, USER_SORT_KEY.USERNAME)}
                  emailProps={valueProps(USER_COLUMN, USER_SORT_KEY.EMAIL)}
                />
              </Table.Td>
              <Table.Td bg={columnBackground(STATUS_COLUMN)}>
                <DemoStatusCell
                  user={user}
                  termProps={valueProps(STATUS_COLUMN, USER_SORT_KEY.STATUS_UNTIL)}
                />
              </Table.Td>
              <Table.Td bg={columnBackground(INVITED_BY_COLUMN)}>
                {user.invitedByUsername ? (
                  <Text fz="sm" {...valueProps(INVITED_BY_COLUMN, USER_SORT_KEY.INVITED_BY)}>
                    {user.invitedByUsername}
                  </Text>
                ) : (
                  <Mdash fz="sm" c="dimmed" />
                )}
              </Table.Td>
              <Table.Td bg={columnBackground(DATES_COLUMN)}>
                <DemoDatesCell
                  user={user}
                  createdProps={valueProps(DATES_COLUMN, USER_SORT_KEY.CREATED_AT)}
                  lastSeenProps={valueProps(DATES_COLUMN, USER_SORT_KEY.LAST_SEEN_AT)}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default DemoUsersTable;

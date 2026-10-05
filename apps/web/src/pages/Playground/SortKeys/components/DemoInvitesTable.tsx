import { Table } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import InviteOutcomeCell from '../../InvitesTable/components/InviteOutcomeCell';
import InviteStatusBadge from '../../InvitesTable/components/InviteStatusBadge';
import RoleBadge from '../../InvitesTable/components/RoleBadge';
import { INVITE_COLUMNS } from '../columns';
import useSortState from '../hooks/useSortState';
import { getColumnBackground, getSortMark, getSortValueProps, sortInvites } from '../lib';
import { MOCK_INVITES } from '../mocks';
import {
  INVITE_SORT_KEY,
  SORT_MARK,
  type InviteSortKey,
  type SortColumn,
  type SortHighlight,
  type SortPicker,
} from '../models';
import DemoCreatedCell from './DemoCreatedCell';
import SortHeader from './SortHeader';

type Props = {
  picker: SortPicker;
  highlight: SortHighlight;
};

const [ROLE_COLUMN, CREATED_BY_COLUMN, STATUS_COLUMN, RESULT_COLUMN] = INVITE_COLUMNS as [
  SortColumn<InviteSortKey>,
  SortColumn<InviteSortKey>,
  SortColumn<InviteSortKey>,
  SortColumn<InviteSortKey>,
];

/** Вкладка «Приглашения» в раскладке T3; по умолчанию — по дате создания, новые сверху, как в
 *  приложении. */
function DemoInvitesTable({ picker, highlight }: Props) {
  const { sort, changeSort } = useSortState<InviteSortKey>({
    key: INVITE_SORT_KEY.CREATED_AT,
    direction: SORT_DIRECTION.DESC,
  });
  const invites = sortInvites(MOCK_INVITES, sort);

  const valueProps = (key: InviteSortKey) =>
    getSortValueProps(highlight, getSortMark(CREATED_BY_COLUMN, key, sort));
  const columnBackground = (column: SortColumn<InviteSortKey>) =>
    getColumnBackground(highlight, getSortMark(column, sort.key, sort) !== SORT_MARK.IDLE);

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {INVITE_COLUMNS.map((column) => (
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
          {invites.map((invite) => (
            <Table.Tr key={invite.id}>
              <Table.Td bg={columnBackground(ROLE_COLUMN)}>
                <RoleBadge role={invite.role} />
              </Table.Td>
              <Table.Td bg={columnBackground(CREATED_BY_COLUMN)}>
                <DemoCreatedCell
                  invite={invite}
                  authorProps={valueProps(INVITE_SORT_KEY.CREATED_BY)}
                  dateProps={valueProps(INVITE_SORT_KEY.CREATED_AT)}
                />
              </Table.Td>
              <Table.Td bg={columnBackground(STATUS_COLUMN)}>
                <InviteStatusBadge status={invite.status} />
              </Table.Td>
              <Table.Td bg={columnBackground(RESULT_COLUMN)}>
                <InviteOutcomeCell invite={invite} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default DemoInvitesTable;

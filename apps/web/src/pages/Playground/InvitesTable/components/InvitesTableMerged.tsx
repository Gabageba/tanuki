import { Table } from '@mantine/core';
import { INVITE_SORT, type InviteSort, type MockInvite, type SortState } from '../models';
import InviteCell from './InviteCell';
import InviteDatesCell from './InviteDatesCell';
import InviteStatusCell from './InviteStatusCell';
import PersonName from './PersonName';
import SortableTh from './SortableTh';

type Props = {
  invites: MockInvite[];
  selfName: string;
  sortState: SortState;
  onSortChange: (sort: InviteSort) => void;
  onOpen: (invite: MockInvite) => void;
};

/** T2: составные ячейки, как у пользователей, — четыре столбца. */
function InvitesTableMerged({ invites, selfName, sortState, onSortChange, onOpen }: Props) {
  const thProps = { ...sortState, onSortChange };

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh column={INVITE_SORT.ROLE} {...thProps}>
              Приглашение
            </SortableTh>
            <SortableTh column={INVITE_SORT.STATUS} {...thProps}>
              Статус
            </SortableTh>
            <SortableTh column={INVITE_SORT.USED_BY} {...thProps}>
              Использовал
            </SortableTh>
            {/* По дате создания: вторая строка ячейки не сортируется. */}
            <SortableTh column={INVITE_SORT.CREATED_AT} {...thProps}>
              Даты
            </SortableTh>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invites.map((invite) => (
            <Table.Tr key={invite.id} onClick={() => onOpen(invite)} style={{ cursor: 'pointer' }}>
              <Table.Td maw={280}>
                <InviteCell invite={invite} isOwn={invite.createdBy === selfName} />
              </Table.Td>
              <Table.Td>
                <InviteStatusCell invite={invite} />
              </Table.Td>
              <Table.Td>
                <PersonName username={invite.usedBy} withAvatar />
              </Table.Td>
              <Table.Td>
                <InviteDatesCell invite={invite} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableMerged;

import { Table, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { INVITE_SORT, type InviteSort, type MockInvite, type SortState } from '../models';
import InviteStatusBadge from './InviteStatusBadge';
import PersonName from './PersonName';
import RoleBadge from './RoleBadge';
import SortableTh from './SortableTh';

type Props = {
  invites: MockInvite[];
  sortState: SortState;
  onSortChange: (sort: InviteSort) => void;
  onOpen: (invite: MockInvite) => void;
};

/** T1: столбец на каждое поле, ничего не объединено. Клик по строке — карточка. */
function InvitesTableSeparate({ invites, sortState, onSortChange, onOpen }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const thProps = { ...sortState, onSortChange };

  return (
    <Table.ScrollContainer minWidth={820}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh column={INVITE_SORT.ROLE} {...thProps}>
              Роль
            </SortableTh>
            <SortableTh column={INVITE_SORT.STATUS} {...thProps}>
              Статус
            </SortableTh>
            <SortableTh column={INVITE_SORT.CREATED_BY} {...thProps}>
              Создал
            </SortableTh>
            <SortableTh column={INVITE_SORT.USED_BY} {...thProps}>
              Использовал
            </SortableTh>
            <SortableTh column={INVITE_SORT.CREATED_AT} {...thProps}>
              Создано
            </SortableTh>
            <SortableTh column={INVITE_SORT.EXPIRES_AT} {...thProps}>
              Истекает
            </SortableTh>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invites.map((invite) => (
            <Table.Tr key={invite.id} onClick={() => onOpen(invite)} style={{ cursor: 'pointer' }}>
              <Table.Td>
                <RoleBadge role={invite.role} />
              </Table.Td>
              <Table.Td>
                <InviteStatusBadge status={invite.status} />
              </Table.Td>
              <Table.Td>
                <PersonName username={invite.createdBy} />
              </Table.Td>
              <Table.Td>
                <PersonName username={invite.usedBy} />
              </Table.Td>
              <Table.Td>
                <Text fz="sm" ff="monospace">
                  {formatDateNumeric(invite.createdAt)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm" ff="monospace">
                  {formatDateNumeric(invite.expiresAt)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableSeparate;

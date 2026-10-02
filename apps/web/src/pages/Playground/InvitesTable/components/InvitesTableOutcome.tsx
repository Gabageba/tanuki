import { Stack, Table, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { getOutcomeColumnTitle } from '../lib';
import {
  INVITE_SORT,
  type InviteSort,
  type MockInvite,
  type OutcomeColumn,
  type SortState,
} from '../models';
import InviteOutcomeCell from './InviteOutcomeCell';
import InviteStatusBadge from './InviteStatusBadge';
import PersonName from './PersonName';
import RoleBadge from './RoleBadge';
import SortableTh from './SortableTh';

type Props = {
  invites: MockInvite[];
  sortState: SortState;
  /** N: как назван столбец с итогом, или итог под бейджем статуса (N4). */
  outcome: OutcomeColumn;
  onSortChange: (sort: InviteSort) => void;
  onOpen: (invite: MockInvite) => void;
};

/** T3: итог вместо «Использовал» и «Истекает» — у каждого статуса своё содержимое. */
function InvitesTableOutcome({ invites, sortState, outcome, onSortChange, onOpen }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const outcomeTitle = getOutcomeColumnTitle(outcome);
  const thProps = { ...sortState, onSortChange };

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh column={INVITE_SORT.ROLE} {...thProps}>
              Роль
            </SortableTh>
            <SortableTh column={INVITE_SORT.CREATED_BY} {...thProps}>
              Создал
            </SortableTh>
            <SortableTh column={INVITE_SORT.STATUS} {...thProps}>
              Статус
            </SortableTh>
            {/* В итоге смешаны имена и даты разного смысла — сортировать нечем. */}
            {outcomeTitle && <Table.Th>{outcomeTitle}</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invites.map((invite) => (
            <Table.Tr key={invite.id} onClick={() => onOpen(invite)} style={{ cursor: 'pointer' }}>
              <Table.Td>
                <RoleBadge role={invite.role} />
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <PersonName username={invite.createdBy} />
                  <Text fz="xs" c="dimmed" ff="monospace">
                    {formatDateNumeric(invite.createdAt)}
                  </Text>
                </Stack>
              </Table.Td>
              {outcomeTitle ? (
                <>
                  <Table.Td>
                    <InviteStatusBadge status={invite.status} />
                  </Table.Td>
                  <Table.Td>
                    <InviteOutcomeCell invite={invite} />
                  </Table.Td>
                </>
              ) : (
                <Table.Td>
                  <Stack gap={6} align="flex-start">
                    <InviteStatusBadge status={invite.status} />
                    <InviteOutcomeCell invite={invite} />
                  </Stack>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableOutcome;

import { Button, Table } from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import { INVITE_STATUS } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import { getRoleLabel } from '../lib';
import type { MockInvite } from '../models';
import InviteStatusBadge from './InviteStatusBadge';

type Props = {
  invites: MockInvite[];
  onRevoke: (id: string) => void;
};

/** T0: нынешняя таблица как есть — весь список, «Отозвать» в строке срабатывает сразу. */
function InvitesTableCurrent({ invites, onRevoke }: Props) {
  const { formatDateNumeric } = useDateFormat();

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Роль</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th>Создал</Table.Th>
            <Table.Th>Использовал</Table.Th>
            <Table.Th>Истекает</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invites.map((invite) => (
            <Table.Tr key={invite.id}>
              <Table.Td>{getRoleLabel(invite.role)}</Table.Td>
              <Table.Td>
                <InviteStatusBadge status={invite.status} />
              </Table.Td>
              <Table.Td>{invite.createdBy ?? <Mdash />}</Table.Td>
              <Table.Td>{invite.usedBy ?? <Mdash />}</Table.Td>
              <Table.Td ff="monospace">{formatDateNumeric(invite.expiresAt)}</Table.Td>
              <Table.Td>
                {invite.status === INVITE_STATUS.ACTIVE && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<XIcon />}
                    onClick={() => onRevoke(invite.id)}
                  >
                    Отозвать
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableCurrent;

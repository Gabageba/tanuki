import { Badge, Button, Table, Text } from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import { USER_ROLE } from '@tanuki/contracts';
import { STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import Mdash from '@/shared/ui/Mdash';
import RoleBadge from './RoleBadge';

const INVITES = [
  {
    id: 'i1',
    role: USER_ROLE.USER,
    isActive: true,
    createdBy: 'kitsune_mod',
    usedBy: null,
    expires: '08.10.2026',
  },
  {
    id: 'i2',
    role: USER_ROLE.MODERATOR,
    isActive: true,
    createdBy: 'tanuki_admin',
    usedBy: null,
    expires: '07.10.2026',
  },
  {
    id: 'i3',
    role: USER_ROLE.USER,
    isActive: false,
    createdBy: 'night_owl',
    usedBy: 'webtoon_guy',
    expires: '04.10.2026',
  },
];

/** P3: нынешняя таблица приглашений — переезжает вкладкой как есть. */
function InvitesMock() {
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
          {INVITES.map((invite) => (
            <Table.Tr key={invite.id}>
              <Table.Td>
                <RoleBadge role={invite.role} />
              </Table.Td>
              <Table.Td>
                <Badge
                  variant="light"
                  color={invite.isActive ? STATUS_OK_COLOR : STATUS_DOWN_COLOR}
                >
                  {invite.isActive ? 'Активен' : 'Использован'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{invite.createdBy}</Text>
              </Table.Td>
              <Table.Td>
                {invite.usedBy ? <Text fz="sm">{invite.usedBy}</Text> : <Mdash c="dimmed" />}
              </Table.Td>
              <Table.Td>
                <Text fz="sm" ff="monospace">
                  {invite.expires}
                </Text>
              </Table.Td>
              <Table.Td>
                {invite.isActive && (
                  <Button variant="subtle" color="red" size="xs" leftSection={<XIcon />}>
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

export default InvitesMock;

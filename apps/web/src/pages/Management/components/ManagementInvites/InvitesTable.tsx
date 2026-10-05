import { Stack, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { INVITES_SORT, type Invite, type InvitesSort, type SortDirection } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import RoleBadge from '../RoleBadge';
import SortableTh from '../SortableTh';
import InvitePerson from './InvitePerson';
import InviteResultCell from './InviteResultCell';
import InviteStatusBadge from './InviteStatusBadge';

type Props = {
  invites: Invite[];
  sort: InvitesSort;
  direction: SortDirection;
  onSortChange: (sort: InvitesSort) => void;
  onOpen: (invite: Invite) => void;
};

/** Кнопок в строках нет: клик по строке открывает карточку приглашения с действиями. На
 *  телефоне та же таблица листается вбок. */
function InvitesTable({ invites, sort, direction, onSortChange, onOpen }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();
  const sortProps = { activeSort: sort, direction, onSortChange };

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh sort={INVITES_SORT.ROLE} {...sortProps}>
              {t('role')}
            </SortableTh>
            <SortableTh sort={INVITES_SORT.CREATED_BY} {...sortProps}>
              {t('createdBy')}
            </SortableTh>
            <SortableTh sort={INVITES_SORT.STATUS} {...sortProps}>
              {t('status')}
            </SortableTh>
            {/* В «Результате» имена и даты разного смысла — сортировать нечем. */}
            <Table.Th>{t('result')}</Table.Th>
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
                  <InvitePerson username={invite.createdByUsername} />
                  <Text fz="xs" c="dimmed" ff="monospace">
                    {formatDateNumeric(invite.createdAt)}
                  </Text>
                </Stack>
              </Table.Td>
              <Table.Td>
                <InviteStatusBadge status={invite.status} />
              </Table.Td>
              <Table.Td>
                <InviteResultCell invite={invite} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTable;

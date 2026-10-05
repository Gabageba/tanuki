import { Stack, Table, Text } from '@mantine/core';
import { CalendarPlusIcon, UserIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { INVITES_SORT, type Invite, type InvitesSort, type SortDirection } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import RoleBadge from '../RoleBadge';
import SortableTh from '@/shared/ui/SortableTh';
import SortMenuTh from '@/shared/ui/SortMenuTh';
import InvitePerson from './InvitePerson';
import InviteResultCell from './InviteResultCell';
import InviteStatusBadge from './InviteStatusBadge';
import { INVITES_COLUMN_WIDTH } from './models';

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
      <Table layout="fixed" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh sort={INVITES_SORT.ROLE} w={INVITES_COLUMN_WIDTH.ROLE} {...sortProps}>
              {t('role')}
            </SortableTh>
            <SortMenuTh
              title={t('createdBy')}
              w={INVITES_COLUMN_WIDTH.CREATED_BY}
              options={[
                {
                  sort: INVITES_SORT.CREATED_BY,
                  label: t('author'),
                  menuLabel: t('byAuthor'),
                  icon: <UserIcon />,
                },
                {
                  sort: INVITES_SORT.CREATED_AT,
                  label: t('date'),
                  menuLabel: t('byCreationDate'),
                  icon: <CalendarPlusIcon />,
                },
              ]}
              {...sortProps}
            />
            <SortableTh sort={INVITES_SORT.STATUS} w={INVITES_COLUMN_WIDTH.STATUS} {...sortProps}>
              {t('status')}
            </SortableTh>
            {/* В «Результате» имена и даты разного смысла — сортировать нечем. */}
            <Table.Th w={INVITES_COLUMN_WIDTH.RESULT}>{t('result')}</Table.Th>
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
                  <Text lh="tight" fz="xs" c="dimmed" ff="monospace">
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

import { Badge, Button, Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { INVITE_STATUS } from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';
import PageLayout from '@/shared/ui/PageLayout';
import useDateFormat from '@/shared/hooks/useDateFormat';
import {
  getInviteStatusColor,
  getInviteStatusLabel,
  getUserRoleLabel,
  type InvitesQuery,
} from '../models';
import useRevokeInvite from '../hooks/useRevokeInvite';

function InvitesTable() {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();
  const revokeInvite = useRevokeInvite();
  const { data } = PageLayout.useQuery<InvitesQuery>();
  const items = data?.items ?? [];

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('role')}</Table.Th>
            <Table.Th>{t('status')}</Table.Th>
            <Table.Th>{t('createdBy')}</Table.Th>
            <Table.Th>{t('usedBy')}</Table.Th>
            <Table.Th>{t('expires')}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((invite) => (
            <Table.Tr key={invite.id}>
              <Table.Td>{getUserRoleLabel(invite.role, t)}</Table.Td>
              <Table.Td>
                <Badge color={getInviteStatusColor(invite.status)} variant="light">
                  {getInviteStatusLabel(invite.status, t)}
                </Badge>
              </Table.Td>
              <Table.Td>{invite.createdByUsername ?? <Mdash />}</Table.Td>
              <Table.Td>{invite.usedByUsername ?? <Mdash />}</Table.Td>
              <Table.Td ff="monospace">{formatDateNumeric(invite.expiresAt)}</Table.Td>
              <Table.Td>
                {invite.status === INVITE_STATUS.ACTIVE && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    loading={revokeInvite.isPending}
                    onClick={() => revokeInvite.mutate(invite.id)}
                  >
                    {t('revoke')}
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

export default InvitesTable;

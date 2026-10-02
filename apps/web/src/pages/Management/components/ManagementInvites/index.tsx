import { Badge, Button, EmptyState, Table } from '@mantine/core';
import { TicketIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { INVITE_STATUS } from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { getUserRoleLabel } from '../../models';
import { getInviteStatusColor, getInviteStatusLabel } from './models';
import InvitesTableSkeleton from './InvitesTableSkeleton';
import useInvites from './hooks/useInvites';
import useRevokeInvite from './hooks/useRevokeInvite';

/** Вкладка «Приглашения» — прежняя страница /invites как есть. */
function ManagementInvites() {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();
  const invites = useInvites();
  const revokeInvite = useRevokeInvite();

  if (invites.isPending) {
    return <InvitesTableSkeleton />;
  }

  if (!invites.data?.items.length) {
    return (
      <EmptyState
        title={t('noInvitesYet')}
        description={t('createInviteToInviteSomeone')}
        icon={<TicketIcon />}
      />
    );
  }

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
          {invites.data.items.map((invite) => (
            <Table.Tr key={invite.id}>
              <Table.Td>{getUserRoleLabel(invite.role, t)}</Table.Td>
              <Table.Td>
                <Badge color={getInviteStatusColor(invite.status)} variant="muted">
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
                    leftSection={<XIcon />}
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

export default ManagementInvites;

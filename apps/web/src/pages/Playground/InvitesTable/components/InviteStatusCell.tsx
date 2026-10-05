import { Stack, Text } from '@mantine/core';
import { INVITE_STATUS } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { formatTimeLeft, getDaysLeft } from '../lib';
import type { MockInvite } from '../models';
import InviteStatusBadge from './InviteStatusBadge';

type Props = {
  invite: MockInvite;
};

/** T2: бейдж, под ним — сколько осталось активному и кто отозвал отозванное. */
function InviteStatusCell({ invite }: Props) {
  return (
    <Stack gap={2} align="flex-start">
      <InviteStatusBadge status={invite.status} />
      {invite.status === INVITE_STATUS.ACTIVE && (
        <Text
          fz="xs"
          c={getDaysLeft(invite.expiresAt) === 0 ? `${STATUS_DEGRADED_COLOR}.7` : 'dimmed'}
        >
          {formatTimeLeft(invite.expiresAt)}
        </Text>
      )}
      {invite.status === INVITE_STATUS.REVOKED && invite.revokedBy && (
        <Text fz="xs" c="dimmed" truncate maw={200}>
          Отозвал {invite.revokedBy}
        </Text>
      )}
    </Stack>
  );
}

export default InviteStatusCell;

import { Stack, Text } from '@mantine/core';
import { INVITE_STATUS } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { formatDays, getDaysLeft } from '../lib';
import type { MockInvite } from '../models';
import PersonName from './PersonName';

type Props = {
  invite: MockInvite;
};

/** T3: чем кончилось приглашение — или чем кончится. Пустой ячейка не бывает. */
function InviteOutcomeCell({ invite }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const daysLeft = getDaysLeft(invite.expiresAt);

  switch (invite.status) {
    case INVITE_STATUS.ACTIVE:
      return (
        <Stack gap={2}>
          <Text fz="sm" c={daysLeft === 0 ? `${STATUS_DEGRADED_COLOR}.7` : undefined}>
            {daysLeft === 0 ? 'Истекает сегодня' : `Истекает через ${formatDays(daysLeft)}`}
          </Text>
          <Text fz="xs" c="dimmed" ff="monospace">
            {formatDateNumeric(invite.expiresAt)}
          </Text>
        </Stack>
      );
    case INVITE_STATUS.USED:
      return (
        <Stack gap={2}>
          <PersonName username={invite.usedBy} withAvatar />
          {invite.usedAt && (
            <Text fz="xs" c="dimmed" ff="monospace">
              {formatDateNumeric(invite.usedAt)}
            </Text>
          )}
        </Stack>
      );
    case INVITE_STATUS.EXPIRED:
      return (
        <Stack gap={2}>
          <Text fz="sm" c="dimmed">
            Никто не зарегистрировался
          </Text>
          <Text fz="xs" c="dimmed" ff="monospace">
            {formatDateNumeric(invite.expiresAt)}
          </Text>
        </Stack>
      );
    case INVITE_STATUS.REVOKED:
      return (
        <Stack gap={2}>
          <Text fz="sm" truncate maw={220}>
            Отозвал {invite.revokedBy}
          </Text>
          {invite.revokedAt && (
            <Text fz="xs" c="dimmed" ff="monospace">
              {formatDateNumeric(invite.revokedAt)}
            </Text>
          )}
        </Stack>
      );
  }
}

export default InviteOutcomeCell;

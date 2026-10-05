import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { INVITE_STATUS, type Invite } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import InvitePerson from './InvitePerson';
import { getDaysLeft } from './models';

type Props = {
  invite: Invite;
};

/** «Результат»: чем кончилось приглашение — или чем кончится. Пустой ячейка не бывает. */
function InviteResultCell({ invite }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();

  const dateLine = (date: string | null) =>
    date && (
      <Text lh="tight" fz="xs" c="dimmed" ff="monospace">
        {formatDateNumeric(date)}
      </Text>
    );

  switch (invite.status) {
    case INVITE_STATUS.ACTIVE: {
      const daysLeft = getDaysLeft(invite.expiresAt);
      return (
        <Stack gap={2}>
          <Text lh="tight" fz="sm" c={daysLeft === 0 ? `${STATUS_DEGRADED_COLOR}.7` : undefined}>
            {daysLeft === 0 ? t('expiresToday') : t('expiresInCountDays', { count: daysLeft })}
          </Text>
          {dateLine(invite.expiresAt)}
        </Stack>
      );
    }
    case INVITE_STATUS.USED:
      return (
        <Stack gap={2}>
          <InvitePerson
            username={invite.usedByUsername}
            avatarUrl={invite.usedByAvatarUrl}
            withAvatar
          />
          {dateLine(invite.usedAt)}
        </Stack>
      );
    case INVITE_STATUS.EXPIRED:
      return (
        <Stack gap={2}>
          <Text lh="tight" fz="sm" c="dimmed">
            {t('nobodyRegistered')}
          </Text>
          {dateLine(invite.expiresAt)}
        </Stack>
      );
    case INVITE_STATUS.REVOKED:
      return (
        <Stack gap={2}>
          {invite.revokedByUsername ? (
            <Text lh="tight" fz="sm" truncate maw={220} title={invite.revokedByUsername}>
              {t('revokedByUsername', { username: invite.revokedByUsername })}
            </Text>
          ) : (
            <InvitePerson username={null} />
          )}
          {dateLine(invite.revokedAt)}
        </Stack>
      );
  }
}

export default InviteResultCell;

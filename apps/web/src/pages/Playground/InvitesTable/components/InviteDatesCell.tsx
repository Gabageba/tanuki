import { Stack } from '@mantine/core';
import { INVITE_STATUS } from '@tanuki/contracts';
import type { MockInvite } from '../models';
import DateLine from './DateLine';

type Props = {
  invite: MockInvite;
};

/** T2: когда создано и чем кончилось — вторая строка зависит от статуса. */
function InviteDatesCell({ invite }: Props) {
  return (
    <Stack gap={2}>
      <DateLine label="Создано" date={invite.createdAt} />
      {invite.status === INVITE_STATUS.ACTIVE && (
        <DateLine label="Истекает" date={invite.expiresAt} />
      )}
      {invite.status === INVITE_STATUS.EXPIRED && (
        <DateLine label="Истекло" date={invite.expiresAt} />
      )}
      {invite.usedAt && <DateLine label="Использовано" date={invite.usedAt} />}
      {invite.revokedAt && <DateLine label="Отозвано" date={invite.revokedAt} />}
    </Stack>
  );
}

export default InviteDatesCell;

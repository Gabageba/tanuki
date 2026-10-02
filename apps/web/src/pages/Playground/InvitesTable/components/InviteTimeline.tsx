import { Text, Timeline } from '@mantine/core';
import {
  HourglassHighIcon,
  HourglassLowIcon,
  PlusIcon,
  UserCheckIcon,
  XIcon,
} from '@phosphor-icons/react';
import { INVITE_STATUS } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { formatTimeLeft } from '../lib';
import type { MockInvite } from '../models';
import PersonName from './PersonName';

type Props = {
  invite: MockInvite;
};

const BULLET_SIZE = 24;
const ICON_SIZE = 12;

/** D2: жизнь приглашения лентой — создано, потом чем кончилось. У активного второй шаг ещё не
 *  наступил: бледный, к нему ведёт пунктир. */
function InviteTimeline({ invite }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const isActive = invite.status === INVITE_STATUS.ACTIVE;

  const date = (isoDate: string | null) =>
    isoDate && (
      <Text fz="xs" c="dimmed" ff="monospace" mt={2}>
        {formatDateNumeric(isoDate)}
      </Text>
    );

  return (
    <Timeline active={isActive ? 0 : 1} bulletSize={BULLET_SIZE} lineWidth={2}>
      <Timeline.Item
        bullet={<PlusIcon size={ICON_SIZE} />}
        title="Создано"
        lineVariant={isActive ? 'dashed' : 'solid'}
      >
        {invite.createdBy ? (
          <PersonName username={invite.createdBy} />
        ) : (
          <Text fz="sm">Из консоли</Text>
        )}
        {date(invite.createdAt)}
      </Timeline.Item>

      {invite.status === INVITE_STATUS.ACTIVE && (
        <Timeline.Item bullet={<HourglassHighIcon size={ICON_SIZE} />} title="Истекает">
          <Text fz="sm" c="dimmed">
            {formatTimeLeft(invite.expiresAt)}
          </Text>
          {date(invite.expiresAt)}
        </Timeline.Item>
      )}
      {invite.status === INVITE_STATUS.USED && (
        <Timeline.Item bullet={<UserCheckIcon size={ICON_SIZE} />} title="Использовано">
          <PersonName username={invite.usedBy} withAvatar />
          {date(invite.usedAt)}
        </Timeline.Item>
      )}
      {invite.status === INVITE_STATUS.EXPIRED && (
        <Timeline.Item bullet={<HourglassLowIcon size={ICON_SIZE} />} title="Истекло">
          <Text fz="sm" c="dimmed">
            Никто не зарегистрировался
          </Text>
          {date(invite.expiresAt)}
        </Timeline.Item>
      )}
      {invite.status === INVITE_STATUS.REVOKED && (
        <Timeline.Item bullet={<XIcon size={ICON_SIZE} />} title="Отозвано">
          <PersonName username={invite.revokedBy} />
          {date(invite.revokedAt)}
        </Timeline.Item>
      )}
    </Timeline>
  );
}

export default InviteTimeline;

import { Stack, Text } from '@mantine/core';
import { USER_STATUS, type ManagedUser } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import type { ValueProps } from '../models';
import UserStatusBadge from './UserStatusBadge';

type Props = {
  user: ManagedUser;
  termProps: ValueProps;
};

/** Копия `UserStatusCell`: бейдж, срок и причина; срок можно выделить отдельно от бейджа. */
function DemoStatusCell({ user, termProps }: Props) {
  const { formatDateNumeric } = useDateFormat();
  const termDate =
    user.status === USER_STATUS.BLOCKED ? user.blockedUntil : user.deletionScheduledAt;
  const hasTerm =
    user.status === USER_STATUS.BLOCKED || user.status === USER_STATUS.DELETION_SCHEDULED;

  return (
    <Stack gap={2} align="flex-start">
      <UserStatusBadge status={user.status} />
      {hasTerm && (
        <Text fz="xs" c="dimmed" {...termProps}>
          {termDate ? (
            <>
              {user.status === USER_STATUS.BLOCKED ? 'До ' : 'Удалится '}
              <Text span inherit ff="monospace">
                {formatDateNumeric(termDate)}
              </Text>
            </>
          ) : (
            'Навсегда'
          )}
        </Text>
      )}
      {user.blockReason && (
        <Text fz="xs" c="dimmed" maw={220} truncate title={user.blockReason}>
          {user.blockReason}
        </Text>
      )}
    </Stack>
  );
}

export default DemoStatusCell;

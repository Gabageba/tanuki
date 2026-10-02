import { Stack, Text } from '@mantine/core';
import type { ManagedUser } from '@tanuki/contracts';
import UserStatusBadge from './UserStatusBadge';
import UserStatusTerm from './UserStatusTerm';

type Props = {
  user: ManagedUser;
};

/** Бейдж статуса, под ним срок и причина блокировки в одну строку — целиком она в карточке. */
function UserStatusCell({ user }: Props) {
  return (
    <Stack gap={2} align="flex-start">
      <UserStatusBadge status={user.status} />
      <UserStatusTerm user={user} />
      {user.blockReason && (
        <Text fz="xs" c="dimmed" maw={220} truncate title={user.blockReason}>
          {user.blockReason}
        </Text>
      )}
    </Stack>
  );
}

export default UserStatusCell;

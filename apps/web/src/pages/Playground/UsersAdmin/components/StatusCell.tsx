import { Box, Stack, Text, Tooltip } from '@mantine/core';
import type { MockUser } from '../models';
import StatusBadge from './StatusBadge';
import StatusTerm from './StatusTerm';

type Props = {
  user: MockUser;
  /** Причина строкой под сроком (T1) или только тултипом на бейдже (T2). */
  withReasonLine: boolean;
};

function StatusCell({ user, withReasonLine }: Props) {
  return (
    <Stack gap={2} align="flex-start">
      <Tooltip
        label={user.blockReason}
        disabled={withReasonLine || !user.blockReason}
        multiline
        maw={260}
      >
        <Box w="fit-content">
          <StatusBadge status={user.status} />
        </Box>
      </Tooltip>
      <StatusTerm user={user} />
      {withReasonLine && user.blockReason && (
        <Text fz="xs" c="dimmed" maw={220} truncate title={user.blockReason}>
          {user.blockReason}
        </Text>
      )}
    </Stack>
  );
}

export default StatusCell;

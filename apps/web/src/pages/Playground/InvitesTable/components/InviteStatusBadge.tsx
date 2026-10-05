import { Badge } from '@mantine/core';
import type { InviteStatus } from '@tanuki/contracts';
import { getInviteStatusColor, getInviteStatusLabel } from '../lib';

type Props = {
  status: InviteStatus;
};

function InviteStatusBadge({ status }: Props) {
  return (
    <Badge color={getInviteStatusColor(status)} variant="muted" flex="none">
      {getInviteStatusLabel(status)}
    </Badge>
  );
}

export default InviteStatusBadge;

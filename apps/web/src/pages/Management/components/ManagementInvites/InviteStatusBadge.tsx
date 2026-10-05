import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { InviteStatus } from '@tanuki/contracts';
import { getInviteStatusColor, getInviteStatusLabel } from './models';

type Props = {
  status: InviteStatus;
};

function InviteStatusBadge({ status }: Props) {
  const { t } = useTranslation();

  return (
    <Badge color={getInviteStatusColor(status)} variant="muted" flex="none">
      {getInviteStatusLabel(status, t)}
    </Badge>
  );
}

export default InviteStatusBadge;

import { Alert, Text } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';

type Props = {
  children: string;
};

/** K1 — заметка на месте фильтров: почему видно только скачанное. */
function OfflineNote({ children }: Props) {
  return (
    <Alert variant="muted" color={STATUS_DEGRADED_COLOR} icon={<CloudSlashIcon />} py="xs">
      <Text fz="sm">{children}</Text>
    </Alert>
  );
}

export default OfflineNote;

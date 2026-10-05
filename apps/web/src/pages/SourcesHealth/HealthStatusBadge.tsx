import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SourceStatus } from '@tanuki/contracts';
import { getSourceStatusColor, getSourceStatusLabel } from '@/entities/source/lib';

type Props = {
  status: SourceStatus;
};

/** Статус бейджем `muted`, как у пользователей и приглашений, в цветах статуса источника. */
function HealthStatusBadge({ status }: Props) {
  const { t } = useTranslation();

  return (
    <Badge color={getSourceStatusColor(status)} variant="muted">
      {getSourceStatusLabel(status, t)}
    </Badge>
  );
}

export default HealthStatusBadge;

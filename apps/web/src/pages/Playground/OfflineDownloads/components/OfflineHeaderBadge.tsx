import { Badge } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';

/** N8 — бейдж «Нет сети» в шапке рядом с логотипом, ведёт в «Загрузки». */
function OfflineHeaderBadge() {
  return (
    <Badge
      component={Link}
      to="#"
      variant="muted"
      color={STATUS_DEGRADED_COLOR}
      size="lg"
      tt="none"
      fw={500}
      leftSection={<CloudSlashIcon size={14} />}
      style={{ cursor: 'pointer' }}
    >
      Нет сети
    </Badge>
  );
}

export default OfflineHeaderBadge;

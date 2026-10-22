import { ActionIcon, Tooltip } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';

/** N1 — значок в шапке рядом с колокольчиком; подсказка объясняет, клик ведёт в «Загрузки». */
function OfflineIcon() {
  return (
    <Tooltip label="Нет сети — доступно скачанное">
      <ActionIcon
        component={Link}
        to="#"
        variant="muted"
        color={STATUS_DEGRADED_COLOR}
        size={34}
        aria-label="Нет сети"
      >
        <CloudSlashIcon size={20} />
      </ActionIcon>
    </Tooltip>
  );
}

export default OfflineIcon;

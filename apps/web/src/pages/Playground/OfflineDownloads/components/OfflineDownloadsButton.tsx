import { Button } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';

type Props = {
  /** В нижней панели телефона — короче: только «Загрузки». */
  isCompact?: boolean;
};

/** N11 — без сети в шапке (и в нижней панели) появляется выход в «Загрузки»: индикатор и путь
 *  одним элементом. */
function OfflineDownloadsButton({ isCompact = false }: Props) {
  return (
    <Button
      component={Link}
      to="#"
      variant="muted"
      color={STATUS_DEGRADED_COLOR}
      size={isCompact ? 'compact-sm' : 'sm'}
      leftSection={<CloudSlashIcon />}
    >
      {isCompact ? 'Загрузки' : 'Нет сети · Загрузки'}
    </Button>
  );
}

export default OfflineDownloadsButton;

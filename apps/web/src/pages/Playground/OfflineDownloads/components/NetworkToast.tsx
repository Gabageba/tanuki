import { Stack, Text } from '@mantine/core';
import { CloudCheckIcon, CloudSlashIcon } from '@phosphor-icons/react';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import ToastShell from '../../Notifications/components/ToastShell';

type Props = {
  isOnline: boolean;
};

/** N3 — тост при пропаже сети и при её возвращении, в виде тостов уведомлений. */
function NetworkToast({ isOnline }: Props) {
  return (
    <ToastShell
      icon={isOnline ? <CloudCheckIcon size={18} /> : <CloudSlashIcon size={18} />}
      color={isOnline ? 'teal' : STATUS_DEGRADED_COLOR}
    >
      <Stack gap={2}>
        <Text fz="sm" fw={500}>
          {isOnline ? 'Сеть вернулась' : 'Нет сети'}
        </Text>
        <Text fz={12} c="dimmed">
          {isOnline
            ? 'Прогресс чтения отправлен, загрузки продолжаются'
            : 'Доступны скачанные главы, закладки и главная'}
        </Text>
      </Stack>
    </ToastShell>
  );
}

export default NetworkToast;

import { Stack, Text } from '@mantine/core';
import { BellIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import ToastShell from './ToastShell';

/** Q3: несколько событий подряд свёрнуты в один тост со ссылкой на ленту. */
function ToastCollapsed() {
  return (
    <ToastShell icon={<BellIcon size={18} />} color={PRIMARY_COLOR} isClickable>
      <Stack gap={2}>
        <Text fz="sm" fw={500}>
          Вход с нового устройства и ещё 2 события
        </Text>
        <Text fz={12} c="dimmed">
          Откройте уведомления, чтобы посмотреть все
        </Text>
      </Stack>
    </ToastShell>
  );
}

export default ToastCollapsed;

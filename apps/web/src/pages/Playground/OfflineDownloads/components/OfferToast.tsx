import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';
import ToastShell from '../../Notifications/components/ToastShell';

type Props = {
  icon: ReactNode;
  color: string;
  title: string;
  detail: string;
  actions: ReactNode;
};

/** Тост с действием — тот же вид, что у тостов уведомлений, плюс кнопки под текстом. */
function OfferToast({ icon, color, title, detail, actions }: Props) {
  return (
    <ToastShell icon={icon} color={color}>
      <Stack gap="xs">
        <Stack gap={2}>
          <Text fz="sm" fw={500}>
            {title}
          </Text>
          <Text fz={12} c="dimmed">
            {detail}
          </Text>
        </Stack>
        {actions}
      </Stack>
    </ToastShell>
  );
}

export default OfferToast;

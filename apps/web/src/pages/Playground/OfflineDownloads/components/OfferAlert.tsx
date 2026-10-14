import type { ReactNode } from 'react';
import { Alert, Stack, Text } from '@mantine/core';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
  /** H5 — серый вместо акцентного: предложение, а не предупреждение. */
  color?: string;
};

/** Предложение на странице в виде M3 push: `Alert variant="muted"` в цветах темы, описание под
 *  заголовком, кнопки в ряд на всю ширину. */
function OfferAlert({ icon, title, description, actions, color }: Props) {
  return (
    <Alert variant="muted" color={color} icon={icon} title={title}>
      <Stack gap="sm">
        <Text fz={13} c="dimmed">
          {description}
        </Text>
        {actions}
      </Stack>
    </Alert>
  );
}

export default OfferAlert;

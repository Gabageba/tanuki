import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';

type Props = {
  label: string;
  children: ReactNode;
};

function DemoControl({ label, children }: Props) {
  return (
    <Stack gap={4}>
      <Text fz={12} c="dimmed">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export default DemoControl;

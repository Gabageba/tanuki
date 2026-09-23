import { Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  right?: ReactNode;
  children: ReactNode;
};

function ReaderSetting({ label, right, children }: Props) {
  return (
    <Stack gap={8}>
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Text lh={1} c="dimmed">
          {label}
        </Text>
        {right}
      </Group>
      {children}
    </Stack>
  );
}

export default ReaderSetting;

import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';

type Props = {
  label: string;
  children: ReactNode;
  /** Место под раскрытый список, чтобы он не наезжал на следующий вариант. */
  mb?: number;
};

/** Подписанное состояние варианта. */
function VariantState({ label, children, mb }: Props) {
  return (
    <Stack gap={6} mb={mb}>
      <Text fz={12} c="dimmed">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export default VariantState;

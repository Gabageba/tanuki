import type { MantineBreakpoint, MantineSpacing, MantineStyleProps } from '@mantine/core';
import { Box, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  color: string;
  label: ReactNode;
  fz?: number;
  dotMt?: MantineStyleProps['mt'];
  coloredText?: boolean;
  fw?: MantineStyleProps['fw'];
  visibleFrom?: MantineBreakpoint;
  gap?: MantineSpacing;
};

function StatusIndicator({
  color,
  label,
  fz = 14,
  dotMt = 1,
  coloredText = false,
  fw = 400,
  visibleFrom,
  gap = 6,
}: Props) {
  return (
    <Group gap={gap} align="center" wrap="nowrap" lh={1} justify="flex-end">
      <Box bg={color} bdrs="50%" w={fz / 2} h={fz / 2} flex="none" mt={dotMt} />
      <Text c={coloredText ? color : undefined} fz={fz} fw={fw} lh={1} visibleFrom={visibleFrom}>
        {label}
      </Text>
    </Group>
  );
}

export default StatusIndicator;

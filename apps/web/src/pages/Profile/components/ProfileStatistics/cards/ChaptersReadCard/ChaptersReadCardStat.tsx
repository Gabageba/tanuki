import type { ReactNode } from 'react';
import { Group, Text } from '@mantine/core';

type Props = {
  value: ReactNode;
  label: string;
  color?: string;
};

function ChaptersReadCardStat({ value, label, color = 'var(--mantine-color-text)' }: Props) {
  return (
    <Group gap={6} align="baseline" wrap="nowrap">
      <Text ff="monospace" lh={1} lts={-1} style={{ wordSpacing: -6 }} c={color}>
        {value}
      </Text>
      <Text fz={12} lh={1} c="dimmed">
        {label}
      </Text>
    </Group>
  );
}

export default ChaptersReadCardStat;

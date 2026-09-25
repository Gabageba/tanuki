import type { MantineBreakpoint } from '@mantine/core';
import { Group, Progress, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { NEUTRAL_BAR_COLOR } from '@/shared/lib/palette';

type Props = {
  items: {
    key: string;
    label: ReactNode;
    value: number;
    text: ReactNode;
  }[];
  highlightedIndex?: number;
  gap?: MantineBreakpoint | number;
};

function ProgressList({ items, highlightedIndex, gap }: Props) {
  const max = Math.max(...items.map(({ value }) => value), 1);

  return (
    <Stack gap={gap}>
      {items.map(({ key, label, value, text }, index) => (
        <Group key={key} gap="md" wrap="nowrap">
          <Text w={150} flex="none" truncate lh={1}>
            {label}
          </Text>
          <Progress
            flex={1}
            size="md"
            radius="xl"
            value={(value / max) * 100}
            color={
              index === highlightedIndex ? 'var(--mantine-primary-color-filled)' : NEUTRAL_BAR_COLOR
            }
            bg="var(--tanuki-color-border-subtle)"
          />
          <Text miw={80} flex="none" ff="monospace" ta="right" lh={1} c="dimmed">
            {text}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

export default ProgressList;

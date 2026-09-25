import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import { NEUTRAL_BAR_COLOR } from '@/shared/lib/palette';

const CHART_HEIGHT = 200;
/** Дальше подпись под каждым столбиком уже не помещается — подписываем каждый пятый. */
const MAX_LABELED_BARS = 12;
const LABEL_STEP = 5;

type Props = {
  items: {
    key: string;
    value: number;
    label: string;
    tooltip: {
      title: ReactNode;
      value: ReactNode;
    };
  }[];
  highlightedIndex?: number;
};

function BarChart({ items, highlightedIndex }: Props) {
  const max = Math.max(...items.map(({ value }) => value), 1);
  const gap = items.length > MAX_LABELED_BARS ? 3 : 10;

  const isLabelVisible = (index: number) =>
    items.length <= MAX_LABELED_BARS || (items.length - 1 - index) % LABEL_STEP === 0;

  return (
    <Stack gap={8}>
      <Group gap={gap} align="flex-end" wrap="nowrap" h={CHART_HEIGHT}>
        {items.map(({ key, value, tooltip }, index) => (
          <Tooltip
            key={key}
            label={
              <Stack gap={4}>
                <Text fz="xs" lh={1}>
                  {tooltip.title}
                </Text>
                <Text fz="xs" fw={600} lh={1}>
                  {tooltip.value}
                </Text>
              </Stack>
            }
            withArrow
          >
            <Box
              flex={1}
              h={`max(2px, ${(value / max) * 100}%)`}
              bg={
                index === highlightedIndex
                  ? 'var(--mantine-primary-color-filled)'
                  : NEUTRAL_BAR_COLOR
              }
              style={{ borderRadius: '4px 4px 0 0' }}
            />
          </Tooltip>
        ))}
      </Group>
      <Group gap={gap} wrap="nowrap">
        {items.map(({ key, label }, index) => (
          <Text key={key} flex={1} ff="monospace" fz={10} c="dimmed" ta="center" lh={1}>
            {isLabelVisible(index) ? label : null}
          </Text>
        ))}
      </Group>
    </Stack>
  );
}

export default BarChart;

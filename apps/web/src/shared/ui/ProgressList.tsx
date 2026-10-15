import type { MantineBreakpoint } from '@mantine/core';
import { Box, getSpacing, Progress, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Fragment } from 'react';
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
    <Box
      display="grid"
      style={{
        // The bar always keeps its minimum width; the label gets what's left and truncates
        gridTemplateColumns: 'minmax(0, max-content) minmax(120px, 1fr) max-content',
        columnGap: 'var(--mantine-spacing-md)',
        rowGap: getSpacing(gap),
        alignItems: 'center',
      }}
    >
      {items.map(({ key, label, value, text }, index) => (
        <Fragment key={key}>
          {/* Подпись и значение — любые узлы (ссылка, иконка), а не только текст: не `<p>`. */}
          <Text component="div" truncate lh="tight">
            {label}
          </Text>
          <Progress
            size="md"
            radius="xl"
            value={(value / max) * 100}
            color={
              index === highlightedIndex ? 'var(--mantine-primary-color-filled)' : NEUTRAL_BAR_COLOR
            }
            bg="var(--tanuki-color-border-subtle)"
          />
          <Text
            component="div"
            ff="monospace"
            ta="right"
            lh="tight"
            c="dimmed"
            style={{ wordSpacing: -6 }}
          >
            {text}
          </Text>
        </Fragment>
      ))}
    </Box>
  );
}

export default ProgressList;

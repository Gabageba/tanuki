import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { NEUTRAL_BAR_COLOR } from '@/shared/lib/palette';

const CHART_HEIGHT = 200;
/** Дальше подпись под каждым столбиком уже не помещается — подписываем каждый labelStep-й. */
const MAX_LABELED_BARS = 12;
const DEFAULT_LABEL_STEP = 5;
const LABEL_HEIGHT = 10;
/** Ближе стольких столбиков подпись опорного налезла бы на подпись наведённого — прячем её. */
const HOVER_CLEARANCE = 3;
/** Подписанные столбики чуть темнее остальных — так видно, к какому из них относится подпись. */
const ANCHOR_BAR_COLOR = 'color-mix(in srgb, var(--mantine-color-dimmed) 75%, transparent)';
const HOVERED_BAR_COLOR = 'var(--mantine-color-dimmed)';

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
  /** Шаг подписей, когда столбиков больше MAX_LABELED_BARS; отсчитывается от последнего. */
  labelStep?: number;
};

/**
 * Подпись шире своего столбика, поэтому висит над ним по центру, а у крайних столбиков
 * прижимается к краю графика, чтобы не вылезать за него.
 */
const getLabelPosition = (index: number, count: number): CSSProperties => {
  if (count > 1 && index === 0) {
    return { left: 0 };
  }
  if (count > 1 && index === count - 1) {
    return { right: 0 };
  }
  return { left: '50%', transform: 'translateX(-50%)' };
};

/**
 * Пока столбиков немного, подписан каждый. Когда их больше MAX_LABELED_BARS, подписан каждый
 * labelStep-й (опорный), и опорные столбики чуть темнее. Наведённый столбик подсвечивается, его
 * подпись встаёт на ось прямо под ним, а соседние опорные на это время уступают ей место —
 * поэтому в подсказке тогда остаётся только значение.
 */
function BarChart({ items, highlightedIndex, labelStep = DEFAULT_LABEL_STEP }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number>();

  const max = Math.max(...items.map(({ value }) => value), 1);
  const isSparse = items.length > MAX_LABELED_BARS;
  const gap = isSparse ? 3 : 10;

  const isAnchor = (index: number) => isSparse && (items.length - 1 - index) % labelStep === 0;

  const isLabelVisible = (index: number) => {
    if (!isSparse) {
      return true;
    }
    if (hoveredIndex === undefined) {
      return isAnchor(index);
    }
    return (
      index === hoveredIndex ||
      (isAnchor(index) && Math.abs(index - hoveredIndex) > HOVER_CLEARANCE)
    );
  };

  const getBarColor = (index: number) => {
    if (index === highlightedIndex) {
      return 'var(--mantine-primary-color-filled)';
    }
    if (isSparse && index === hoveredIndex) {
      return HOVERED_BAR_COLOR;
    }
    if (isAnchor(index)) {
      return ANCHOR_BAR_COLOR;
    }
    return NEUTRAL_BAR_COLOR;
  };

  return (
    <Stack gap={8}>
      <Group
        gap={gap}
        align="flex-end"
        wrap="nowrap"
        h={CHART_HEIGHT}
        onMouseLeave={() => setHoveredIndex(undefined)}
      >
        {items.map(({ key, value, tooltip }, index) => (
          <Tooltip
            key={key}
            label={
              <Stack gap={4}>
                {!isSparse && (
                  <Text fz="xs" lh={1}>
                    {tooltip.title}
                  </Text>
                )}
                <Text fz="xs" fw={600} lh={1}>
                  {tooltip.value}
                </Text>
              </Stack>
            }
            withArrow
          >
            {/* Наведение ловит вся колонка, а не только столбик — у пустого дня он в 2px высотой. */}
            <Box
              flex={1}
              h="100%"
              display="flex"
              style={{ alignItems: 'flex-end' }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <Box
                w="100%"
                h={`max(2px, ${(value / max) * 100}%)`}
                bg={getBarColor(index)}
                style={{ borderRadius: '4px 4px 0 0' }}
              />
            </Box>
          </Tooltip>
        ))}
      </Group>
      <Group gap={gap} wrap="nowrap">
        {items.map(({ key, label }, index) => {
          const isHovered = isSparse && index === hoveredIndex;
          return (
            <Box key={key} flex={1} h={LABEL_HEIGHT} pos="relative">
              {isLabelVisible(index) && (
                <Text
                  ff="monospace"
                  fz={LABEL_HEIGHT}
                  c={isHovered ? undefined : 'dimmed'}
                  fw={isHovered ? 600 : undefined}
                  lh={1}
                  pos="absolute"
                  top={0}
                  style={{
                    ...(isSparse
                      ? getLabelPosition(index, items.length)
                      : { left: '50%', transform: 'translateX(-50%)' }),
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Text>
              )}
            </Box>
          );
        })}
      </Group>
    </Stack>
  );
}

export default BarChart;

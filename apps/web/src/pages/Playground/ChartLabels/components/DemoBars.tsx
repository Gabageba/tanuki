import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { NEUTRAL_BAR_COLOR } from '@/shared/lib/palette';
import { BAR_GAP, CHART_HEIGHT, type DemoPoint } from '../models';
import { formatWeekdayDate, getBarMarginLeft } from '../lib';

type Props = {
  points: DemoPoint[];
  groupSize?: number;
  hoveredIndex?: number;
  onHoveredIndexChange?: (index?: number) => void;
  /** Дата уже видна на оси — тогда в подсказке остаётся только число. */
  withTooltipDate?: boolean;
  isEmphasized?: (index: number) => boolean;
};

const getBarColor = (isToday: boolean, isHovered: boolean, isEmphasized: boolean) => {
  if (isToday) {
    return 'var(--mantine-primary-color-filled)';
  }
  if (isHovered) {
    return 'var(--mantine-color-dimmed)';
  }
  if (isEmphasized) {
    return 'color-mix(in srgb, var(--mantine-color-dimmed) 75%, transparent)';
  }
  return NEUTRAL_BAR_COLOR;
};

/** Столбики месячного графика — как в профиле, плюс то, что нужно вариантам подписей. */
function DemoBars({
  points,
  groupSize,
  hoveredIndex,
  onHoveredIndexChange,
  withTooltipDate = true,
  isEmphasized,
}: Props) {
  const max = Math.max(...points.map(({ count }) => count), 1);

  return (
    <Group
      gap={BAR_GAP}
      align="flex-end"
      wrap="nowrap"
      h={CHART_HEIGHT}
      onMouseLeave={() => onHoveredIndexChange?.(undefined)}
    >
      {points.map(({ date, count }, index) => (
        <Tooltip
          key={date}
          label={
            <Stack gap={4}>
              {withTooltipDate && (
                <Text fz="xs" lh={1}>
                  {formatWeekdayDate(date)}
                </Text>
              )}
              <Text fz="xs" fw={600} lh={1}>
                {count} гл.
              </Text>
            </Stack>
          }
          withArrow
        >
          {/* Ховер ловит вся колонка, а не только столбик — у пустого дня он в 2px высотой. */}
          <Box
            flex={1}
            h="100%"
            ml={getBarMarginLeft(index, points.length, groupSize)}
            display="flex"
            style={{ alignItems: 'flex-end' }}
            onMouseEnter={() => onHoveredIndexChange?.(index)}
          >
            <Box
              w="100%"
              h={`max(2px, ${(count / max) * 100}%)`}
              bg={getBarColor(
                index === points.length - 1,
                index === hoveredIndex,
                isEmphasized?.(index) ?? false,
              )}
              style={{ borderRadius: '4px 4px 0 0' }}
            />
          </Box>
        </Tooltip>
      ))}
    </Group>
  );
}

export default DemoBars;

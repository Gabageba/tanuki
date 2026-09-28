import { Box, Group, Stack } from '@mantine/core';
import { BAR_GAP, GROUP_GAP, LABEL_FONT_SIZE, WEEK_DAYS, type DemoPoint } from '../models';
import { formatRange, getWeekGroups } from '../lib';
import DemoBars from './DemoBars';
import AxisLabel from './AxisLabel';

/** Обрывок недели слева короче этого — диапазон на нём не помещается, оставляем только скобку. */
const MIN_LABELED_DAYS = 4;

type Props = {
  points: DemoPoint[];
};

/**
 * L3 — столбики собраны в недели от сегодняшнего дня назад, между неделями зазор шире. Под
 * каждой неделей — скобка и диапазон: подпись относится к группе, а не к одному столбику.
 */
function LabelsWeeks({ points }: Props) {
  const groups = getWeekGroups(points.length);

  return (
    <Stack gap={6}>
      <DemoBars points={points} groupSize={WEEK_DAYS} />
      <Group gap={GROUP_GAP} wrap="nowrap" align="flex-start">
        {groups.map(({ start, end }) => {
          const days = end - start + 1;
          return (
            // Та же доля ширины, что у столбиков недели: n столбиков плюс n−1 зазоров между ними.
            <Box
              key={start}
              pos="relative"
              h={LABEL_FONT_SIZE + 6}
              style={{
                flex: `${days} 1 ${(days - 1) * BAR_GAP}px`,
                borderTop: '1px solid var(--mantine-color-default-border)',
              }}
            >
              {days >= MIN_LABELED_DAYS && (
                <AxisLabel top={6}>{formatRange(points[start]!.date, points[end]!.date)}</AxisLabel>
              )}
            </Box>
          );
        })}
      </Group>
    </Stack>
  );
}

export default LabelsWeeks;

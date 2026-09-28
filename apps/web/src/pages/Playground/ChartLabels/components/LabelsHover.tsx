import { useState } from 'react';
import { Stack } from '@mantine/core';
import { LABEL_FONT_SIZE, type DemoPoint } from '../models';
import { formatDayMonth, getEdgeAlign } from '../lib';
import DemoBars from './DemoBars';
import AxisRow from './AxisRow';
import AxisLabel from './AxisLabel';

type Props = {
  points: DemoPoint[];
};

/**
 * L2 — постоянно подписаны только края периода. Наведённый столбик подсвечивается, а его дата
 * встаёт на ось ровно под ним, вместо краёв; в подсказке остаётся только число.
 */
function LabelsHover({ points }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const lastIndex = points.length - 1;

  const isLabelVisible = (index: number) =>
    hoveredIndex === undefined ? index === 0 || index === lastIndex : index === hoveredIndex;

  return (
    <Stack gap={8}>
      <DemoBars
        points={points}
        hoveredIndex={hoveredIndex}
        onHoveredIndexChange={setHoveredIndex}
        withTooltipDate={false}
      />
      <AxisRow
        count={points.length}
        height={LABEL_FONT_SIZE}
        renderCell={(index) =>
          isLabelVisible(index) && (
            <AxisLabel align={getEdgeAlign(index, points.length)} isActive={index === hoveredIndex}>
              {formatDayMonth(points[index]!.date)}
            </AxisLabel>
          )
        }
      />
    </Stack>
  );
}

export default LabelsHover;

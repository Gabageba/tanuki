import { useState } from 'react';
import { Stack } from '@mantine/core';
import { LABEL_FONT_SIZE, type DemoPoint } from '../models';
import { formatDayMonth, getEdgeAlign, isWeeklyIndex } from '../lib';
import DemoBars from './DemoBars';
import AxisRow from './AxisRow';
import AxisLabel from './AxisLabel';

/** Ближе стольких столбиков недельная подпись налезла бы на дату наведённого — прячем её. */
const HOVER_CLEARANCE = 3;

type Props = {
  points: DemoPoint[];
};

/**
 * L6 — L4 + L2: в покое подписи раз в неделю и подписанные столбики темнее. Наведённый столбик
 * подсвечивается, его дата встаёт на ось прямо под ним, а соседние недельные подписи на это время
 * уступают ей место. В подсказке остаётся только число.
 */
function LabelsAnchorsHover({ points }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const isWeekly = (index: number) => isWeeklyIndex(index, points.length);

  const isLabelVisible = (index: number) => {
    if (hoveredIndex === undefined) {
      return isWeekly(index);
    }
    return (
      index === hoveredIndex ||
      (isWeekly(index) && Math.abs(index - hoveredIndex) > HOVER_CLEARANCE)
    );
  };

  return (
    <Stack gap={8}>
      <DemoBars
        points={points}
        isEmphasized={isWeekly}
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

export default LabelsAnchorsHover;

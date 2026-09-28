import { Stack } from '@mantine/core';
import { LABEL_FONT_SIZE, type DemoPoint } from '../models';
import { formatDayMonth, getEdgeAlign, isWeeklyIndex } from '../lib';
import DemoBars from './DemoBars';
import AxisRow from './AxisRow';
import AxisLabel from './AxisLabel';

type Props = {
  points: DemoPoint[];
};

/**
 * L4 — подписи те же, что сейчас, но подписанные столбики чуть темнее остальных: связь между
 * датой и днём держит цвет, а не риска.
 */
function LabelsAnchors({ points }: Props) {
  const isWeekly = (index: number) => isWeeklyIndex(index, points.length);

  return (
    <Stack gap={8}>
      <DemoBars points={points} isEmphasized={isWeekly} />
      <AxisRow
        count={points.length}
        height={LABEL_FONT_SIZE}
        renderCell={(index) =>
          isWeekly(index) && (
            <AxisLabel align={getEdgeAlign(index, points.length)}>
              {formatDayMonth(points[index]!.date)}
            </AxisLabel>
          )
        }
      />
    </Stack>
  );
}

export default LabelsAnchors;

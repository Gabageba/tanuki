import { Stack, Text } from '@mantine/core';
import { LABEL_FONT_SIZE, type DemoPoint } from '../models';
import { formatDayMonth, isWeeklyIndex } from '../lib';
import DemoBars from './DemoBars';
import AxisRow from './AxisRow';

/** Высота ряда под подпись «дд.мм», наклонённую на 45°: ширина·sin45 плюс сама строка. */
const SLANTED_ROW_HEIGHT = 30;

type Props = {
  points: DemoPoint[];
};

/**
 * L5 — L4 с наклонными подписями: конец подписи упирается ровно в центр своего столбика, так что
 * ширина даты больше не мешает понять, к какому дню она относится.
 */
function LabelsSlanted({ points }: Props) {
  const isWeekly = (index: number) => isWeeklyIndex(index, points.length);

  return (
    <Stack gap={4}>
      <DemoBars points={points} isEmphasized={isWeekly} />
      <AxisRow
        count={points.length}
        height={SLANTED_ROW_HEIGHT}
        renderCell={(index) =>
          isWeekly(index) && (
            <Text
              ff="monospace"
              fz={LABEL_FONT_SIZE}
              lh={1}
              c="dimmed"
              pos="absolute"
              top={0}
              right="50%"
              style={{
                whiteSpace: 'nowrap',
                transform: 'rotate(-45deg)',
                transformOrigin: 'right top',
              }}
            >
              {formatDayMonth(points[index]!.date)}
            </Text>
          )
        }
      />
    </Stack>
  );
}

export default LabelsSlanted;

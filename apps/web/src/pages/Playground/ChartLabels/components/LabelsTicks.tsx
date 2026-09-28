import { Box, Stack } from '@mantine/core';
import { LABEL_FONT_SIZE, type DemoPoint } from '../models';
import { formatDayMonth, getEdgeAlign, isWeeklyIndex } from '../lib';
import DemoBars from './DemoBars';
import AxisRow from './AxisRow';
import AxisLabel from './AxisLabel';

const TICK_HEIGHT = 4;
const LABEL_TOP = TICK_HEIGHT + 3;

type Props = {
  points: DemoPoint[];
};

/** L0 — то, что сейчас в профиле: «дд.мм» раз в неделю и риска к столбику. */
function LabelsTicks({ points }: Props) {
  return (
    <Stack gap={0}>
      <DemoBars points={points} />
      <AxisRow
        count={points.length}
        height={LABEL_TOP + LABEL_FONT_SIZE}
        renderCell={(index) =>
          isWeeklyIndex(index, points.length) && (
            <>
              <Box
                pos="absolute"
                top={0}
                left="50%"
                w={1}
                h={TICK_HEIGHT}
                bg="var(--mantine-color-dimmed)"
                style={{ transform: 'translateX(-50%)' }}
              />
              <AxisLabel align={getEdgeAlign(index, points.length)} top={LABEL_TOP}>
                {formatDayMonth(points[index]!.date)}
              </AxisLabel>
            </>
          )
        }
      />
    </Stack>
  );
}

export default LabelsTicks;

import { Box, Stack } from '@mantine/core';
import { LABEL_ALIGN, LABEL_FONT_SIZE, type DemoPoint } from '../models';
import { formatDay, formatMonth, isWeeklyIndex, toLocalDate } from '../lib';
import DemoBars from './DemoBars';
import AxisRow from './AxisRow';
import AxisLabel from './AxisLabel';

/** Обрывок месяца слева короче этого — его название не влезает до следующего, не подписываем. */
const MIN_MONTH_LABEL_DAYS = 5;
const MONTH_ROW_HEIGHT = LABEL_FONT_SIZE + 4;

type Props = {
  points: DemoPoint[];
};

/**
 * L1 — под столбиком только число: оно узкое и стоит ровно под своим днём. Месяц — отдельной
 * строкой, один раз, от первого дня месяца, с чертой на стыке.
 */
function LabelsDayMonth({ points }: Props) {
  const isMonthStart = (index: number) => toLocalDate(points[index]!.date).getDate() === 1;
  const nextMonthStart = points.findIndex((_, index) => index > 0 && isMonthStart(index));
  const isFirstMonthLabeled = nextMonthStart === -1 || nextMonthStart >= MIN_MONTH_LABEL_DAYS;

  return (
    <Stack gap={6}>
      <DemoBars points={points} />
      <AxisRow
        count={points.length}
        height={LABEL_FONT_SIZE}
        renderCell={(index) =>
          isWeeklyIndex(index, points.length) && (
            <AxisLabel>{formatDay(points[index]!.date)}</AxisLabel>
          )
        }
      />
      <AxisRow
        count={points.length}
        height={MONTH_ROW_HEIGHT}
        renderCell={(index) => {
          const isStart = index > 0 && isMonthStart(index);
          if (!isStart && !(index === 0 && isFirstMonthLabeled)) {
            return null;
          }
          return (
            <>
              {isStart && (
                <Box
                  pos="absolute"
                  top={0}
                  left={0}
                  w={1}
                  h={MONTH_ROW_HEIGHT}
                  bg="var(--mantine-color-default-border)"
                />
              )}
              <Box pos="absolute" top={2} left={isStart ? 4 : 0}>
                <AxisLabel align={LABEL_ALIGN.START}>{formatMonth(points[index]!.date)}</AxisLabel>
              </Box>
            </>
          );
        }}
      />
    </Stack>
  );
}

export default LabelsDayMonth;

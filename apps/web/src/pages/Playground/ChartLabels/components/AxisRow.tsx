import type { ReactNode } from 'react';
import { Box, Group } from '@mantine/core';
import { BAR_GAP } from '../models';
import { getBarMarginLeft } from '../lib';

type Props = {
  count: number;
  height: number;
  groupSize?: number;
  renderCell: (index: number) => ReactNode;
};

/** Ряд под графиком с той же сеткой, что у столбиков: ячейка i стоит ровно под столбиком i. */
function AxisRow({ count, height, groupSize, renderCell }: Props) {
  return (
    <Group gap={BAR_GAP} wrap="nowrap">
      {Array.from({ length: count }, (_, index) => (
        <Box
          key={index}
          flex={1}
          h={height}
          pos="relative"
          ml={getBarMarginLeft(index, count, groupSize)}
        >
          {renderCell(index)}
        </Box>
      ))}
    </Group>
  );
}

export default AxisRow;

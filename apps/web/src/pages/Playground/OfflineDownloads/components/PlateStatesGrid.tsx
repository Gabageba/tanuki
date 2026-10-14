import type { ReactNode } from 'react';
import { SimpleGrid, Stack, Text } from '@mantine/core';
import { getPlateStateLabel } from '../lib';
import { PLATE_STATE, type PlateState } from '../models';

type Props = {
  render: (state: PlateState) => ReactNode;
  cols?: number;
};

const STATES = Object.values(PLATE_STATE);

/** Вариант плашки во всех состояниях рядом, с подписью состояния над каждым. */
function PlateStatesGrid({ render, cols = 4 }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, xl: cols }} spacing="lg" maw={1240}>
      {STATES.map((state) => (
        <Stack key={state} gap={6}>
          <Text fz={12} c="dimmed" ff="monospace">
            {getPlateStateLabel(state)}
          </Text>
          {render(state)}
        </Stack>
      ))}
    </SimpleGrid>
  );
}

export default PlateStatesGrid;

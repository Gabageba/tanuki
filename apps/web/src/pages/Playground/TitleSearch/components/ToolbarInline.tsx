import type { ReactNode } from 'react';
import { Box, Group, Stack } from '@mantine/core';

type Props = {
  filtersButton: ReactNode;
  viewSwitch: ReactNode;
  pills: ReactNode;
  /** Кнопка «Фильтры» растягивается на всё, что осталось от вида (M1). */
  isFiltersGrow?: boolean;
  /** Вид прижат к правому краю (M1, M2), а не стоит сразу за кнопкой (G1). */
  isSpread?: boolean;
};

/** G1 / M1 / M2 — «Фильтры» и вид одной строкой, пилюли — под ней. */
function ToolbarInline({
  filtersButton,
  viewSwitch,
  pills,
  isFiltersGrow = false,
  isSpread = false,
}: Props) {
  return (
    <Stack gap="sm">
      <Group justify={isSpread ? 'space-between' : 'flex-start'} wrap="nowrap" gap="sm">
        {isFiltersGrow ? <Box flex={1}>{filtersButton}</Box> : filtersButton}
        {viewSwitch}
      </Group>
      {pills}
    </Stack>
  );
}

export default ToolbarInline;

import { Box } from '@mantine/core';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';

type Props = {
  /** null — столбец не активен, обе каретки бледные. */
  direction: SortDirection | null;
};

const DIMMED = 'var(--mantine-color-dimmed)';

/**
 * `CaretUpDownIcon` — один path, его не покрасить по половинам. Поэтому две копии друг на друге,
 * каждая обрезана до своей каретки: каретка текущего направления — цветом текста, вторая — бледной.
 */
function SortCaretsIcon({ direction }: Props) {
  return (
    <Box pos="relative" w="1em" h="1em" flex="none">
      <CaretUpDownIcon
        color={direction === SORT_DIRECTION.ASC ? 'currentColor' : DIMMED}
        style={{ position: 'absolute', inset: 0, clipPath: 'inset(0 0 50% 0)' }}
      />
      <CaretUpDownIcon
        color={direction === SORT_DIRECTION.DESC ? 'currentColor' : DIMMED}
        style={{ position: 'absolute', inset: 0, clipPath: 'inset(50% 0 0 0)' }}
      />
    </Box>
  );
}

export default SortCaretsIcon;

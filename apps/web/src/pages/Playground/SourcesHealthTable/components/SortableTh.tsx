import type { ReactNode } from 'react';
import { Group, type MantineStyleProps, Table, UnstyledButton } from '@mantine/core';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';
import SortCaretsIcon from './SortCaretsIcon';

type Props<Sort extends string> = {
  sort: Sort;
  activeSort: Sort;
  direction: SortDirection;
  onSortChange: (sort: Sort) => void;
  w?: MantineStyleProps['w'];
  children: ReactNode;
};

/** Копия `SortableTh` из «Управления». Заголовок столбца-кнопка: двойная каретка, у активного столбца половина направления ярче. */
function SortableTh<Sort extends string>({
  sort,
  activeSort,
  direction,
  onSortChange,
  w,
  children,
}: Props<Sort>) {
  const isActive = sort === activeSort;
  const isAscending = direction === SORT_DIRECTION.ASC;

  return (
    <Table.Th w={w} aria-sort={isActive ? (isAscending ? 'ascending' : 'descending') : undefined}>
      <UnstyledButton fz="inherit" fw="inherit" onClick={() => onSortChange(sort)}>
        <Group gap={4} wrap="nowrap">
          {children}
          <SortCaretsIcon direction={isActive ? direction : null} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export default SortableTh;

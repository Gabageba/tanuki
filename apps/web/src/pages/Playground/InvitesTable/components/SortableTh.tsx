import type { ReactNode } from 'react';
import { Group, Table, UnstyledButton } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import type { InviteSort, SortState } from '../models';
import SortCaretsIcon from './SortCaretsIcon';

type Props = SortState & {
  /** По чему сортирует этот столбец. */
  column: InviteSort;
  onSortChange: (sort: InviteSort) => void;
  children: ReactNode;
};

/** Тот же заголовок-кнопка, что у пользователей: у активного столбца половина каретки ярче. */
function SortableTh({ column, sort, direction, onSortChange, children }: Props) {
  const isActive = column === sort;
  const isAscending = direction === SORT_DIRECTION.ASC;

  return (
    <Table.Th aria-sort={isActive ? (isAscending ? 'ascending' : 'descending') : undefined}>
      <UnstyledButton fz="inherit" fw="inherit" onClick={() => onSortChange(column)}>
        <Group gap={4} wrap="nowrap">
          {children}
          <SortCaretsIcon direction={isActive ? direction : null} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export default SortableTh;

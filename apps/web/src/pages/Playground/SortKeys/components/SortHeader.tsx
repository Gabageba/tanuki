import { Table } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import { getColumnBackground } from '../lib';
import {
  SORT_PICKER,
  type SortColumn,
  type SortHighlight,
  type SortKeyOption,
  type SortPicker,
  type SortState,
} from '../models';
import SortHeaderContent from './SortHeaderContent';

type Props<Key extends string> = {
  column: SortColumn<Key>;
  picker: SortPicker;
  highlight: SortHighlight;
  sort: SortState<Key>;
  onSortChange: (option: SortKeyOption<Key>) => void;
};

/** Заголовок столбца в раскладке оси K. В K0 столбец знает только свой первый ключ — так устроено
 *  сейчас, и сортировка по второму (дата создания приглашения) заголовка не имеет. */
function SortHeader<Key extends string>({
  column,
  picker,
  highlight,
  sort,
  onSortChange,
}: Props<Key>) {
  const reachable = picker === SORT_PICKER.CURRENT ? column.keys.slice(0, 1) : column.keys;
  const isActive = reachable.some((option) => option.key === sort.key);
  const isAscending = sort.direction === SORT_DIRECTION.ASC;

  return (
    <Table.Th
      aria-sort={isActive ? (isAscending ? 'ascending' : 'descending') : undefined}
      bg={getColumnBackground(highlight, isActive)}
      style={{ verticalAlign: 'top' }}
    >
      <SortHeaderContent column={column} picker={picker} sort={sort} onSortChange={onSortChange} />
    </Table.Th>
  );
}

export default SortHeader;

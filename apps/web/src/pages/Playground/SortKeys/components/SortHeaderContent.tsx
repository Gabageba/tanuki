import { Fragment } from 'react';
import { Group, Text } from '@mantine/core';
import {
  SORT_PICKER,
  type SortColumn,
  type SortKeyOption,
  type SortPicker,
  type SortState,
} from '../models';
import SortKeyButton from './SortKeyButton';
import SortMenu from './SortMenu';

type Props<Key extends string> = {
  column: SortColumn<Key>;
  picker: SortPicker;
  sort: SortState<Key>;
  onSortChange: (option: SortKeyOption<Key>) => void;
};

/** Что стоит в заголовке: в K0 и у столбца с одним ключом — одна кнопка, в K1 — кнопка на каждый
 *  ключ, в K2 — меню. */
function SortHeaderContent<Key extends string>({ column, picker, sort, onSortChange }: Props<Key>) {
  const [first] = column.keys;

  if (!first) {
    return column.title;
  }

  if (picker === SORT_PICKER.CURRENT || column.keys.length === 1) {
    return (
      <SortKeyButton option={first} label={column.title} sort={sort} onSortChange={onSortChange} />
    );
  }

  if (picker === SORT_PICKER.SPLIT) {
    return (
      <Group gap={6} wrap="nowrap">
        {column.keys.map((option, index) => (
          <Fragment key={option.key}>
            {index > 0 && (
              <Text span c="dimmed" fw={400}>
                ·
              </Text>
            )}
            <SortKeyButton
              option={option}
              label={option.label}
              sort={sort}
              onSortChange={onSortChange}
            />
          </Fragment>
        ))}
      </Group>
    );
  }

  return <SortMenu column={column} sort={sort} onSortChange={onSortChange} picker={picker} />;
}

export default SortHeaderContent;

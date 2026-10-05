import { useState } from 'react';
import { SORT_DIRECTION } from '@tanuki/contracts';
import type { SortKeyOption, SortState } from '../models';

/** Повторный выбор того же ключа меняет направление, новый ключ начинает со своего — как в
 *  «Управлении». */
function useSortState<Key extends string>(initial: SortState<Key>) {
  const [sort, setSort] = useState(initial);

  const changeSort = (option: SortKeyOption<Key>) =>
    setSort((current) =>
      current.key === option.key
        ? {
            key: current.key,
            direction:
              current.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
          }
        : { key: option.key, direction: option.defaultDirection },
    );

  return { sort, changeSort };
}

export default useSortState;

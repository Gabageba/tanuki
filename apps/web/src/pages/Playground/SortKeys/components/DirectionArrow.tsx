import { ArrowDownIcon, ArrowUpIcon } from '@phosphor-icons/react';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';

type Props = {
  direction: SortDirection;
  size: number;
  color?: string;
};

/** Стрелка выбранного направления — в пункте меню и в подписи под заголовком. */
function DirectionArrow({ direction, size, color }: Props) {
  return direction === SORT_DIRECTION.ASC ? (
    <ArrowUpIcon size={size} color={color} />
  ) : (
    <ArrowDownIcon size={size} color={color} />
  );
}

export default DirectionArrow;

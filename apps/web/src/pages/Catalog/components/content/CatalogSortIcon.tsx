import { SortAscendingIcon, SortDescendingIcon } from '@phosphor-icons/react';
import type { SortDirection } from '@tanuki/contracts';
import { SORT_DIRECTION } from '@tanuki/contracts';

type Props = {
  direction: SortDirection;
};

function CatalogSortIcon({ direction }: Props) {
  if (direction === SORT_DIRECTION.ASC) {
    return <SortAscendingIcon />;
  }

  if (direction === SORT_DIRECTION.DESC) {
    return <SortDescendingIcon />;
  }
}

export default CatalogSortIcon;

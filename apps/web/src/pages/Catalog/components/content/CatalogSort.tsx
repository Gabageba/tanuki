import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SORT_DIRECTION, type SortDirection, type SortOrder } from '@tanuki/contracts';
import { resolveOrder } from '../../utils/sortOrder';
import { getSortOrderLabel } from '@/entities/source/sortOrder';
import PageLayout from '@/shared/ui/PageLayout';
import SortCombobox from '@/shared/ui/SortCombobox';
import type { CatalogParams } from '../../models';

type Props = {
  sortOrders: SortOrder[];
  supportsDirection: boolean;
};

function CatalogSort({ sortOrders, supportsDirection }: Props) {
  const { t } = useTranslation();
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  const order = resolveOrder(params.order, sortOrders);
  const direction = params.direction ?? SORT_DIRECTION.DESC;

  const handleOrderChange = (nextOrder: SortOrder) => {
    setParams({ ...params, order: nextOrder });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('order', nextOrder);
        return next;
      },
      { replace: true },
    );
  };

  const handleDirectionChange = (nextDirection: SortDirection) => {
    setParams({ ...params, direction: nextDirection });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('direction', nextDirection);
        return next;
      },
      { replace: true },
    );
  };

  if (!sortOrders.length) {
    return null;
  }

  return (
    <SortCombobox
      miw={220}
      flex={{ base: 1, sm: 'none' }}
      options={sortOrders.map((value) => ({ value, label: getSortOrderLabel(value, t) }))}
      value={order}
      onChange={handleOrderChange}
      direction={supportsDirection ? direction : undefined}
      onDirectionChange={handleDirectionChange}
    />
  );
}

export default CatalogSort;

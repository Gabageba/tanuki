import { Combobox, Input, InputBase, useCombobox } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { SORT_DIRECTION, type SortDirection, type SortOrder } from '@tanuki/contracts';
import { getSortDirectionLabel, getSortOrderLabel, resolveOrder } from '../../utils/sortOrder';
import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams } from '../../models';
import ComboboxOption from '@/shared/ui/option/ComboboxOption';
import CatalogSortIcon from './CatalogSortIcon';

type Props = {
  sortOrders: SortOrder[];
  supportsDirection: boolean;
};

function CatalogSort({ sortOrders, supportsDirection }: Props) {
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();
  const combobox = useCombobox();

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
    combobox.closeDropdown();
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

  if (params.query || !sortOrders.length) {
    return null;
  }

  return (
    <Combobox
      store={combobox}
      floatingHeight="viewport"
      onOptionSubmit={(value) => {
        if (Object.values(SORT_DIRECTION).includes(value as SortDirection)) {
          handleDirectionChange(value as SortDirection);
        } else {
          handleOrderChange(value as SortOrder);
        }
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          size="sm"
          pointer
          w={200}
          flex={{ base: 1, sm: 'none' }}
          rightSection={<Combobox.Chevron />}
          leftSection={supportsDirection && <CatalogSortIcon direction={direction} />}
          rightSectionPointerEvents="none"
          onClick={() => combobox.toggleDropdown()}
        >
          {order ? getSortOrderLabel(order) : <Input.Placeholder>Сортировка</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {sortOrders.map((value) => (
            <ComboboxOption
              key={value}
              label={getSortOrderLabel(value)}
              value={value}
              selected={value === order}
            />
          ))}
        </Combobox.Options>
        {supportsDirection && (
          <Combobox.Footer p={4}>
            <ComboboxOption
              label={getSortDirectionLabel(SORT_DIRECTION.DESC)}
              value={SORT_DIRECTION.DESC}
              selected={direction === SORT_DIRECTION.DESC}
            />
            <ComboboxOption
              label={getSortDirectionLabel(SORT_DIRECTION.ASC)}
              value={SORT_DIRECTION.ASC}
              selected={direction === SORT_DIRECTION.ASC}
            />
          </Combobox.Footer>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default CatalogSort;

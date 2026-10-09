import { useEffect } from 'react';
import { Group } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import { SORT_DIRECTION, type FilterSelection } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import {
  isFiltersLockedByQuery,
  resolveEffectiveSortOrders,
  resolveOrder,
} from '../../utils/sortOrder';
import { serializeFilters } from '@/features/filters/lib/filterSelection';
import type { CatalogParams } from '../../models';
import useFilters from '../../hooks/useFilters';
import FilterBar from '@/features/filters/FilterBar';
import CatalogSettingsSkeleton from './CatalogSettingsSkeleton';
import CatalogSort from './CatalogSort';
import CatalogViewMode from './CatalogViewMode';

type Props = {
  sourceId: string | undefined;
};

function CatalogSettings({ sourceId }: Props) {
  const { t } = useTranslation();
  const { data: source, isPending: isSourcePending } = useSource({ sourceId });
  const { data: filters, isPending: isFiltersPending } = useFilters({ sourceId });
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  const isFiltersLocked = isFiltersLockedByQuery(source, params.query);
  const activeFilters = isFiltersLocked ? undefined : params.filters;

  const { sortOrders: effectiveSortOrders, supportsDirection: effectiveSupportsDirection } =
    resolveEffectiveSortOrders(source, filters?.groups, activeFilters);
  const order = resolveOrder(params.order, effectiveSortOrders);
  const direction = params.direction ?? SORT_DIRECTION.DESC;

  // Сортировка (и направление, если источник его поддерживает) не может отсутствовать в урле
  // и не может остаться той, что недоступна для активного фильтра (см.
  // resolveEffectiveSortOrders) — как только источник/фильтры подгрузились, сразу закрепляем
  // актуальные значения в урле. Оба поля обновляются одним setParams/setSearchParams, чтобы не
  // потерять одно изменение из-за того, что setParams — обычный useState-сеттер, а не
  // функциональный.
  useEffect(() => {
    const needsOrder = order !== undefined && params.order !== order;
    const needsDirection = effectiveSupportsDirection && !params.direction;
    if (!needsOrder && !needsDirection) return;

    setParams({
      ...params,
      ...(needsOrder && { order }),
      ...(needsDirection && { direction }),
    });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (needsOrder) next.set('order', order);
        if (needsDirection) next.set('direction', direction);
        return next;
      },
      { replace: true },
    );
  }, [order, direction, params, effectiveSupportsDirection, setParams, setSearchParams]);

  const handleFiltersChange = (next: FilterSelection[]) => {
    setParams({ ...params, filters: next });
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.delete('filters');
        for (const value of serializeFilters(next)) {
          nextParams.append('filters', value);
        }
        return nextParams;
      },
      { replace: true },
    );
  };

  if (!sourceId || isSourcePending || isFiltersPending) {
    return <CatalogSettingsSkeleton />;
  }

  return (
    <FilterBar
      w="100%"
      mb="md"
      groups={filters?.groups}
      selection={params.filters ?? []}
      onChange={handleFiltersChange}
      locked={isFiltersLocked}
      lockedNote={t('titleSearchWithoutFilters')}
      actions={
        <Group gap="xs">
          <CatalogSort
            sortOrders={effectiveSortOrders}
            supportsDirection={effectiveSupportsDirection}
          />
          <CatalogViewMode />
        </Group>
      }
    />
  );
}

export default CatalogSettings;

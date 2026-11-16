import { useSearchParams } from 'react-router';
import { useEffect } from 'react';
import { Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { updateSearchParams } from '@/shared/lib/searchParams';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import { toOptionalQuery } from '@/shared/ui/QueryBlock/lib';
import { SORT_DIRECTION } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import {
  isFiltersLockedByQuery,
  resolveEffectiveSortOrders,
  resolveOrder,
} from '../../utils/sortOrder';
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
  const sourceQuery = useSource({ sourceId });
  const filtersQuery = useFilters({ sourceId });
  const source = sourceQuery.data;
  const filters = filtersQuery.data;
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  const isFiltersLocked = isFiltersLockedByQuery(source, params.query);
  const activeFilters = isFiltersLocked ? undefined : params.filters;

  const { sortOrders: effectiveSortOrders, supportsDirection: effectiveSupportsDirection } =
    resolveEffectiveSortOrders(source, filters?.groups, activeFilters);
  const order = resolveOrder(params.order, effectiveSortOrders);
  const direction = params.direction ?? SORT_DIRECTION.DESC;

  // После загрузки источника и фильтров закрепляем доступную сортировку в URL.
  useEffect(() => {
    if (sourceQuery.isPending || filtersQuery.isPending) return;
    const needsOrder = order !== undefined && params.order !== order;
    const needsDirection = effectiveSupportsDirection && !params.direction;
    if (!needsOrder && !needsDirection) return;

    setSearchParams(
      (current) =>
        updateSearchParams(current, {
          ...(needsOrder && { order }),
          ...(needsDirection && { direction }),
        }),
      { replace: true },
    );
  }, [
    order,
    direction,
    params,
    effectiveSupportsDirection,
    setSearchParams,
    sourceQuery.isPending,
    filtersQuery.isPending,
  ]);

  return (
    // Фильтры не загрузились — пропадает только кнопка «Фильтры», сортировка и вид остаются.
    <QueryBlock
      query={[sourceQuery, toOptionalQuery(filtersQuery)]}
      skeleton={<CatalogSettingsSkeleton />}
    >
      {([, filtersData]) => (
        <FilterBar
          w="100%"
          mb="md"
          groups={filtersData?.groups}
          selection={params.filters ?? []}
          onChange={(filters) => setParams({ ...params, filters })}
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
      )}
    </QueryBlock>
  );
}

export default CatalogSettings;

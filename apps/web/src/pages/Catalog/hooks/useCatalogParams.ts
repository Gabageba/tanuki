import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { parseFilters, serializeFilters } from '@/features/filters/lib/filterSelection';
import { getStoredViewMode } from '@/shared/lib/viewMode';
import { updateSearchParams } from '@/shared/lib/searchParams';
import { parseSortDirection, parseSortOrder } from '../utils/sortOrder';
import type { CatalogParams } from '../models';

function useCatalogParams(sourceId: string, isSearchLocked: boolean) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(getStoredViewMode);
  const params: CatalogParams = {
    sourceId,
    query: isSearchLocked ? undefined : (searchParams.get('query') ?? undefined),
    order: parseSortOrder(searchParams.get('order')),
    direction: parseSortDirection(searchParams.get('direction')),
    filters: parseFilters(searchParams.getAll('filters')),
    viewMode,
  };

  const setParams = (next: CatalogParams) => {
    setViewMode(next.viewMode);
    setSearchParams(
      (current) =>
        updateSearchParams(current, {
          query: next.query,
          order: next.order,
          direction: next.direction,
          filters: serializeFilters(next.filters ?? []),
        }),
      { replace: true, flushSync: true },
    );
  };

  return { params, setParams };
}

export default useCatalogParams;

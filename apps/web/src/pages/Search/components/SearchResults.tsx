import { useMemo, useState } from 'react';
import { Stack } from '@mantine/core';
import useSources from '@/entities/source/hooks/useSources';
import { flattenSources } from '@/entities/source/lib';
import {
  getStoredViewMode,
  setStoredViewMode,
  VIEW_MODE,
  type ViewMode,
} from '@/shared/lib/viewMode';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import useSearchFilters from '../hooks/useSearchFilters';
import { countSearchFilters, getSearchPlaces } from '../lib';
import { EMPTY_SEARCH_FILTERS, type SearchPageQuery } from '../models';
import NotRespondedBlock from './NotRespondedBlock';
import SearchFound from './SearchFound';
import SearchHeader from './SearchHeader';
import SearchSettings from './SearchSettings';
import SearchSettingsSkeleton from './SearchSettingsSkeleton';

type Props = {
  query: string;
};

/**
 * Выдача по запросу. Запрос поиска — основной запрос страницы: ошибку показывает
 * PageLayout.Content. Веер идёт потоком — секции встают на места источников по мере ответов,
 * остальные места скелетоном; «Нашлось на:» и «Не ответили» растут по ходу. Фильтры остаются на
 * месте, в том числе когда веер перезапускает их смена.
 */
function SearchResults({ query }: Props) {
  const { filters, setFilters } = useSearchFilters();
  const { data, retryMissed, isRetrying } = PageLayout.useQuery<SearchPageQuery>();
  const sourcesQuery = useSources();
  const sourcesData = sourcesQuery.data;
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? VIEW_MODE.GRID);

  const sources = useMemo(() => flattenSources(sourcesData), [sourcesData]);
  const { found, missed, places } = data
    ? getSearchPlaces(data, sources)
    : { found: [], missed: [], places: null };

  const handleViewModeChange = (next: ViewMode) => {
    setStoredViewMode(next);
    setViewMode(next);
  };

  return (
    <>
      <SearchHeader query={query} found={found} />
      <PageLayout.Content>
        <Stack gap="lg">
          <QueryBlock query={sourcesQuery} skeleton={<SearchSettingsSkeleton />}>
            {(data) => (
              <SearchSettings
                sources={flattenSources(data).filter(({ isEnabled }) => isEnabled)}
                filters={filters}
                onFiltersChange={setFilters}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />
            )}
          </QueryBlock>
          <SearchFound
            places={places}
            query={query}
            viewMode={viewMode}
            withFilters={countSearchFilters(filters) > 0}
            onResetFilters={() => setFilters(EMPTY_SEARCH_FILTERS)}
          />
          <NotRespondedBlock
            missed={missed}
            isRetrying={isRetrying}
            onRetry={() => retryMissed(missed.map(({ source }) => source.id))}
          />
        </Stack>
      </PageLayout.Content>
    </>
  );
}

export default SearchResults;

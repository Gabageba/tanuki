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
import useSearchFilters from '../hooks/useSearchFilters';
import { countSearchFilters, splitSearchGroups } from '../lib';
import { EMPTY_SEARCH_FILTERS, type SearchPageQuery } from '../models';
import NotRespondedBlock from './NotRespondedBlock';
import NothingFound from './NothingFound';
import SearchHeader from './SearchHeader';
import SearchSettings from './SearchSettings';
import SearchSettingsSkeleton from './SearchSettingsSkeleton';
import SourceResultsList from './SourceResultsList';

type Props = {
  query: string;
};

/**
 * Выдача по запросу. Запрос поиска — основной запрос страницы: лоадер и ошибку показывает
 * PageLayout.Content, поэтому пока идёт веер, вместо фильтров ничего. Если выдача пришла раньше
 * источников, на месте фильтров скелетон.
 */
function SearchResults({ query }: Props) {
  const { filters, setFilters } = useSearchFilters();
  const { data, isFetching, refetch } = PageLayout.useQuery<SearchPageQuery>();
  const { data: sourcesData, isPending: isSourcesPending } = useSources();
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? VIEW_MODE.GRID);

  const sources = useMemo(() => flattenSources(sourcesData), [sourcesData]);
  const enabledSources = useMemo(() => sources.filter(({ isEnabled }) => isEnabled), [sources]);
  const { found, missed } = splitSearchGroups(data?.groups ?? [], sources);

  const handleViewModeChange = (next: ViewMode) => {
    setStoredViewMode(next);
    setViewMode(next);
  };

  return (
    <>
      <SearchHeader query={query} found={found} />
      <PageLayout.Content>
        <Stack gap="lg">
          {isSourcesPending ? (
            <SearchSettingsSkeleton />
          ) : (
            <SearchSettings
              sources={enabledSources}
              filters={filters}
              onFiltersChange={setFilters}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          )}
          {found.length > 0 ? (
            <SourceResultsList found={found} query={query} viewMode={viewMode} />
          ) : (
            <NothingFound
              withFilters={countSearchFilters(filters) > 0}
              onReset={() => setFilters(EMPTY_SEARCH_FILTERS)}
            />
          )}
          <NotRespondedBlock
            missed={missed}
            isRetrying={isFetching}
            onRetry={() => void refetch()}
          />
        </Stack>
      </PageLayout.Content>
    </>
  );
}

export default SearchResults;

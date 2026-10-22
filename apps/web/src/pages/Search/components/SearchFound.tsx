import type { ViewMode } from '@tanuki/contracts';
import type { SearchPlace } from '../models';
import NothingFound from './NothingFound';
import SourceResultsList from './SourceResultsList';
import SourceResultsListSkeleton from './SourceResultsListSkeleton';

type Props = {
  /** null — порядок мест ещё не пришёл. */
  places: SearchPlace[] | null;
  query: string;
  viewMode: ViewMode;
  withFilters: boolean;
  onResetFilters: () => void;
};

/**
 * Выдача под фильтрами: до первого события потока — три места скелетоном, затем места
 * источников по мере ответов; «Ничего не нашлось» — когда ответили все и ничего нет.
 */
function SearchFound({ places, query, viewMode, withFilters, onResetFilters }: Props) {
  if (!places) {
    return <SourceResultsListSkeleton viewMode={viewMode} />;
  }

  if (places.length === 0) {
    return <NothingFound withFilters={withFilters} onReset={onResetFilters} />;
  }

  return <SourceResultsList places={places} query={query} viewMode={viewMode} />;
}

export default SearchFound;

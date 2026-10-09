import { useSearchParams } from 'react-router';
import useSearch from './useSearch';
import useSearchFilters from './useSearchFilters';

/** Запрос страницы для PageLayout: строка и фильтры берутся из адреса, поэтому params не нужны. */
function useSearchPageQuery() {
  const [searchParams] = useSearchParams();
  const { filters } = useSearchFilters();

  return useSearch({ query: searchParams.get('query')?.trim() ?? '', filters });
}

export default useSearchPageQuery;

import { useSearchParams } from 'react-router';
import { readSearchFilters, writeSearchFilters } from '../lib';
import type { SearchFilters } from '../models';

/** Фильтры поиска живут в адресе: каждое изменение — новая запись истории, «Назад» их вернёт. */
function useSearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setFilters = (filters: SearchFilters) =>
    setSearchParams((prev) => writeSearchFilters(prev, filters));

  return { filters: readSearchFilters(searchParams), setFilters };
}

export default useSearchFilters;

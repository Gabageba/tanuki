import { useQuery } from '@tanstack/react-query';
import type { SearchResponse } from '@tanuki/contracts';
import { apiFetch } from '../client';

function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiFetch<SearchResponse>(`/search?query=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}

export default useSearch;

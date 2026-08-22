import { useQuery } from '@tanstack/react-query';
import type { SearchResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  query: string;
};

function useSearch({ query }: Params) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiFetch<SearchResponse>(`/search?query=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}

export default useSearch;

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SEARCH_HISTORY_QUERY_KEY } from '@/entities/search/hooks/useSearchHistory';
import { writeSearchFilters } from '../lib';
import type { SearchFilters } from '../models';

type Params = {
  query: string;
  filters: SearchFilters;
};

function useSearch({ query, filters }: Params) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: async () => {
      const params = writeSearchFilters(new URLSearchParams({ query }), filters);
      const response = await apiFetch<SearchResponse>(`/search?${params.toString()}`);
      // Сервер записал запрос в недавние — дропдаун шапки должен его показать.
      void queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_QUERY_KEY });
      return response;
    },
    enabled: query.length > 0,
  });
}

export default useSearch;

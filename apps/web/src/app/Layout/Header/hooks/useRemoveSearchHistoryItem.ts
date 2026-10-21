import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SearchHistoryResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SEARCH_HISTORY_QUERY_KEY } from '@/entities/search/hooks/useSearchHistory';

/** Убирает запрос из недавних сразу, не дожидаясь сервера; без подтверждения — потеря мелкая. */
function useRemoveSearchHistoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (query: string) =>
      apiFetch<void>(`/search/history?query=${encodeURIComponent(query)}`, { method: 'DELETE' }),
    onMutate: async (query) => {
      await queryClient.cancelQueries({ queryKey: SEARCH_HISTORY_QUERY_KEY });
      const previous = queryClient.getQueryData<SearchHistoryResponse>(SEARCH_HISTORY_QUERY_KEY);
      queryClient.setQueryData<SearchHistoryResponse>(
        SEARCH_HISTORY_QUERY_KEY,
        (current) => current && { items: current.items.filter((item) => item.query !== query) },
      );
      return { previous };
    },
    onError: (_error, _query, context) => {
      queryClient.setQueryData(SEARCH_HISTORY_QUERY_KEY, context?.previous);
    },
  });
}

export default useRemoveSearchHistoryItem;

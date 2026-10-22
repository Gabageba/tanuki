import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SearchHistoryResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SEARCH_HISTORY_QUERY_KEY } from '@/entities/search/hooks/useSearchHistory';

/** Очищает недавние сразу, не дожидаясь сервера; без подтверждения — потеря мелкая. */
function useClearSearchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>('/search/history', { method: 'DELETE' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SEARCH_HISTORY_QUERY_KEY });
      const previous = queryClient.getQueryData<SearchHistoryResponse>(SEARCH_HISTORY_QUERY_KEY);
      queryClient.setQueryData<SearchHistoryResponse>(SEARCH_HISTORY_QUERY_KEY, { items: [] });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(SEARCH_HISTORY_QUERY_KEY, context?.previous);
    },
  });
}

export default useClearSearchHistory;

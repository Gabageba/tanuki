import { useQuery } from '@tanstack/react-query';
import type { SearchHistoryResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

/** Ключ недавних запросов: его сбрасывают поиск (запрос записан) и настройка истории. */
export const SEARCH_HISTORY_QUERY_KEY = ['search-history'] as const;

/** Недавние запросы поиска, свежие сверху, — для дропдауна строки поиска в шапке. */
function useSearchHistory() {
  return useQuery({
    queryKey: SEARCH_HISTORY_QUERY_KEY,
    queryFn: () => apiFetch<SearchHistoryResponse>('/search/history'),
  });
}

export default useSearchHistory;

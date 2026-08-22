import { useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  sourceId: string;
  query?: string;
};

function useCatalog({ sourceId, query: searchQuery }: Params) {
  const queryClient = useQueryClient();
  const forceNextFetch = useRef(false);
  const queryKey = ['catalog', sourceId, searchQuery];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const force = pageParam === 0 && forceNextFetch.current;
      forceNextFetch.current = false;
      const params = new URLSearchParams({ page: String(pageParam) });
      if (searchQuery) {
        params.set('query', searchQuery);
      }
      if (force) {
        params.set('refresh', 'true');
      }
      return apiFetch<CatalogResponse>(`/sources/${sourceId}/manga?${params.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    // Обновляем только вручную (кнопка/pull-to-refresh) или по перезагрузке вкладки —
    // не рефетчим сами на маунте и не ретраим упавший запрос.
    // refetchOnWindowFocus: false задан глобально в query-client.ts.
    staleTime: Infinity,
    retry: false,
  });

  // Сбрасывает только страницы этого источника и форсирует обход серверного кеша для
  // первой страницы — остальные источники в react-query кеше не трогаются.
  const refresh = () => {
    forceNextFetch.current = true;
    return queryClient.resetQueries({ queryKey });
  };

  return { ...query, refresh };
}

export default useCatalog;

import { useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogResponse, FilterSelection, SortOrder } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { serializeFilters } from '../utils/filterSelection';
import { resolveOrder } from '../utils/sortOrder';
import useSource from '@/entities/source/hooks/useSource';

type Params = {
  sourceId: string;
  query?: string;
  filters?: FilterSelection[];
  order?: SortOrder;
};

function useCatalog({ sourceId, query: searchQuery, filters, order: explicitOrder }: Params) {
  const { data: source, isLoading: isSourceLoading } = useSource({ sourceId });
  const order = resolveOrder(explicitOrder, source);

  const queryClient = useQueryClient();
  const forceNextFetch = useRef(false);
  const queryKey = ['catalog', sourceId, searchQuery, filters ?? [], order];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const force = pageParam === 0 && forceNextFetch.current;
      forceNextFetch.current = false;
      const params = new URLSearchParams({ page: String(pageParam) });
      if (searchQuery) {
        params.set('query', searchQuery);
      }
      if (order) {
        params.set('order', order);
      }
      for (const value of serializeFilters(filters ?? [])) {
        params.append('filters', value);
      }
      if (force) {
        params.set('refresh', 'true');
      }
      return apiFetch<CatalogResponse>(`/sources/${sourceId}/manga?${params.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    // Ждём, пока не подгрузится источник (а с ним и order по умолчанию) — иначе первый
    // запрос уходит без order и почти сразу рефетчится с ним, то есть каталог грузится дважды.
    enabled: !isSourceLoading,
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

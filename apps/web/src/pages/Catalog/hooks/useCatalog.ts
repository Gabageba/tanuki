import { useRef } from 'react';
import { keepPreviousData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogResponse, FilterSelection, SortDirection, SortOrder } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { serializeFilters } from '@/features/filters/lib/filterSelection';
import {
  isFiltersLockedByQuery,
  resolveEffectiveSortOrders,
  resolveOrder,
} from '../utils/sortOrder';
import type { ViewMode } from '@/shared/lib/viewMode';
import useSource from '@/entities/source/hooks/useSource';
import useFilters from './useFilters';

type Params = {
  sourceId: string;
  query?: string;
  filters?: FilterSelection[];
  order?: SortOrder;
  direction?: SortDirection;
  // Не участвует в запросе — часть общего params-стейта страницы только ради синхронизации с урлом.
  viewMode?: ViewMode;
};

function useCatalog({
  sourceId,
  query: searchQuery,
  filters: selectedFilters,
  order: explicitOrder,
  direction,
}: Params) {
  const {
    data: source,
    isPending: isSourcePending,
    fetchStatus: sourceFetchStatus,
  } = useSource({ sourceId });
  // Тот же queryKey ['filters', sourceId], что и в CatalogSettings — react-query отдаёт общий
  // кэш/in-flight запрос, second call здесь не бьёт по сети отдельно.
  const { data: filtersData } = useFilters({ sourceId });
  const filters = isFiltersLockedByQuery(source, searchQuery) ? undefined : selectedFilters;
  const { sortOrders: effectiveSortOrders } = resolveEffectiveSortOrders(
    source,
    filtersData?.groups,
    filters,
  );
  const order = resolveOrder(explicitOrder, effectiveSortOrders);

  const queryClient = useQueryClient();
  const forceNextFetch = useRef(false);
  const queryKey = ['catalog', sourceId, searchQuery, filters ?? [], order, direction];

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
      if (direction) {
        params.set('direction', direction);
      }
      for (const value of serializeFilters(filters ?? [])) {
        params.append('filters', value);
      }
      if (force) {
        params.set('refresh', 'true');
      }
      return apiFetch<CatalogResponse>(`/sources/${sourceId}/titles?${params.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    // Ждём, пока не подгрузится источник (а с ним и order по умолчанию) — иначе первый
    // запрос уходит без order и почти сразу рефетчится с ним, то есть каталог грузится дважды.
    enabled: !isSourcePending,
    // Смена фильтра, сортировки или поиска — 200 мс старая сетка, потом скелетон (см. QueryBlock).
    placeholderData: keepPreviousData,
    // Обновляем только вручную (кнопка/pull-to-refresh) или по перезагрузке вкладки —
    // не рефетчим сами на маунте и при фокусе и не ретраим упавший запрос.
    staleTime: Infinity,
    retry: false,
  });

  // Сбрасывает только страницы этого источника и форсирует обход серверного кеша для
  // первой страницы — остальные источники в react-query кеше не трогаются.
  const refresh = () => {
    forceNextFetch.current = true;
    return queryClient.resetQueries({ queryKey });
  };

  // Каталог ждёт источник: без сети на паузе он, а не каталог, — страница всё равно должна сказать
  // «Нет соединения», а не висеть в скелетоне.
  const fetchStatus =
    sourceFetchStatus === 'paused' && query.data === undefined ? 'paused' : query.fetchStatus;

  return { ...query, fetchStatus, refresh };
}

export default useCatalog;

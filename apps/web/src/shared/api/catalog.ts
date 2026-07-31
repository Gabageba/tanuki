import { useInfiniteQuery } from '@tanstack/react-query';
import type { CatalogResponse } from '@tanuki/contracts';
import { apiFetch } from './client';

export function useCatalog(sourceId: string) {
  return useInfiniteQuery({
    queryKey: ['catalog', sourceId],
    queryFn: ({ pageParam }) =>
      apiFetch<CatalogResponse>(`/sources/${sourceId}/manga?page=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
}

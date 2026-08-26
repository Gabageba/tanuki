import { useQuery } from '@tanstack/react-query';
import type { FiltersResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  sourceId: string | undefined;
};

function useFilters({ sourceId }: Params) {
  return useQuery({
    queryKey: ['filters', sourceId],
    queryFn: () => apiFetch<FiltersResponse>(`/sources/${sourceId}/filters`),
    enabled: !!sourceId,
    staleTime: Infinity,
  });
}

export default useFilters;

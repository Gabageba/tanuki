import { useQuery } from '@tanstack/react-query';
import type { SourcesCountResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

function useSourcesCount() {
  return useQuery({
    queryKey: ['sources', 'count'],
    queryFn: () => apiFetch<SourcesCountResponse>('/sources/count'),
  });
}

export default useSourcesCount;

import { useQuery } from '@tanstack/react-query';
import type { SourcesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { HEALTH_REFETCH_INTERVAL_MS } from '../models';

function useSourcesHealth() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => apiFetch<SourcesResponse>('/sources'),
    refetchInterval: HEALTH_REFETCH_INTERVAL_MS,
  });
}

export default useSourcesHealth;

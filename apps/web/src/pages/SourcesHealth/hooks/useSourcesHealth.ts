import { useQuery } from '@tanstack/react-query';
import type { SourcesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { HEALTH_REFETCH_INTERVAL_MS } from '../models';

/** Источники с их здоровьем. Данные живые — опрашиваются по таймеру, перезапрос тихий. */
function useSourcesHealth() {
  const query = useQuery({
    queryKey: ['sources'],
    queryFn: () => apiFetch<SourcesResponse>('/sources'),
    refetchInterval: HEALTH_REFETCH_INTERVAL_MS,
  });

  return { ...query, isLive: true };
}

export default useSourcesHealth;

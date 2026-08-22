import { useQuery } from '@tanstack/react-query';
import type { Source } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  sourceId: string | undefined;
};

function useSource({ sourceId }: Params) {
  return useQuery({
    queryKey: ['source', sourceId],
    queryFn: () => apiFetch<Source>(`/sources/${sourceId}`),
    enabled: !!sourceId,
  });
}

export default useSource;

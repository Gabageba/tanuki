import { useQuery } from '@tanstack/react-query';
import type { SourcesResponse } from '@tanuki/contracts';
import { apiFetch } from '../client';

function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => apiFetch<SourcesResponse>('/sources'),
  });
}

export default useSources;

import { useQuery } from '@tanstack/react-query';
import type { ChaptersResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  titleId: string;
  branch?: string;
};

function useChapters({ titleId, branch }: Params) {
  return useQuery({
    queryKey: ['chapters', titleId, branch ?? null],
    queryFn: () =>
      apiFetch<ChaptersResponse>(
        `/titles/${titleId}/chapters${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`,
      ),
  });
}

export default useChapters;

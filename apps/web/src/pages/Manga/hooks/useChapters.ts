import { useQuery } from '@tanstack/react-query';
import type { ChaptersResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  mangaId: string;
  branch?: string;
};

function useChapters({ mangaId, branch }: Params) {
  return useQuery({
    queryKey: ['chapters', mangaId, branch ?? null],
    queryFn: () =>
      apiFetch<ChaptersResponse>(
        `/manga/${mangaId}/chapters${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`,
      ),
  });
}

export default useChapters;

import { useQuery } from '@tanstack/react-query';
import type { ChaptersResponse } from '@tanuki/contracts';
import { apiFetch } from '../client';

function useChapters(sourceId: string, mangaId: string, branch?: string) {
  return useQuery({
    queryKey: ['chapters', sourceId, mangaId, branch ?? null],
    queryFn: () =>
      apiFetch<ChaptersResponse>(
        `/manga/${sourceId}/${mangaId}/chapters${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`,
      ),
  });
}

export default useChapters;

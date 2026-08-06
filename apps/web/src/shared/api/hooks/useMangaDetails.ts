import { useQuery } from '@tanstack/react-query';
import type { MangaDetailsResponse } from '@tanuki/contracts';
import { apiFetch } from '../client';

function useMangaDetails(sourceId: string, mangaId: string) {
  return useQuery({
    queryKey: ['manga', sourceId, mangaId],
    queryFn: () => apiFetch<MangaDetailsResponse>(`/manga/${sourceId}/${mangaId}`),
  });
}

export default useMangaDetails;

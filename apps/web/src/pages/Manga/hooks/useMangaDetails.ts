import { useQuery } from '@tanstack/react-query';
import type { MangaDetailsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  sourceId: string;
  mangaId: string;
};

function useMangaDetails({ sourceId, mangaId }: Params) {
  return useQuery({
    queryKey: ['manga', sourceId, mangaId],
    queryFn: () => apiFetch<MangaDetailsResponse>(`/manga/${sourceId}/${mangaId}`),
  });
}

export default useMangaDetails;

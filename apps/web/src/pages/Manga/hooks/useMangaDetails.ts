import { useQuery } from '@tanstack/react-query';
import type { MangaDetailsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  mangaId: string;
};

function useMangaDetails({ mangaId }: Params) {
  return useQuery({
    queryKey: ['manga', mangaId],
    queryFn: () => apiFetch<MangaDetailsResponse>(`/manga/${mangaId}`),
  });
}

export default useMangaDetails;

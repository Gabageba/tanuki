import { useQuery } from '@tanstack/react-query';
import type { MangaMatchesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  sourceId: string;
  mangaId: string;
};

/**
 * Поиск того же тайтла на других источниках. Запрос опрашивает два десятка сайтов и потому
 * медленный, зато его результат живёт в серверном кеше часами — на клиенте держим его свежим
 * долго, чтобы переходы между вкладками не перезапускали веер.
 */
function useMangaMatches({ sourceId, mangaId }: Params) {
  return useQuery({
    queryKey: ['manga', sourceId, mangaId, 'matches'],
    queryFn: () => apiFetch<MangaMatchesResponse>(`/manga/${sourceId}/${mangaId}/matches`),
    staleTime: 30 * 60 * 1000,
  });
}

export default useMangaMatches;

import { useQuery } from '@tanstack/react-query';
import type { TitleMatchesResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

type Params = {
  titleId: string;
};

/**
 * Поиск того же тайтла на других источниках. Запрос опрашивает два десятка сайтов и потому
 * медленный, зато его результат живёт в серверном кеше часами — на клиенте держим его свежим
 * долго, чтобы переходы между вкладками не перезапускали веер.
 */
function useTitleMatches({ titleId }: Params) {
  return useQuery({
    queryKey: ['title', titleId, 'matches'],
    queryFn: () => apiFetch<TitleMatchesResponse>(`/titles/${titleId}/matches`),
    staleTime: 30 * 60 * 1000,
  });
}

export default useTitleMatches;

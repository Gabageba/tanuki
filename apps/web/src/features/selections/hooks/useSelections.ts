import { useQuery } from '@tanstack/react-query';
import type { SelectionsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { getSelectionsQueryKey } from '../models';

/**
 * Блоки главной сайта одного источника. Не ответивший источник приходит статусом в ответе, а не
 * ошибкой запроса. `enabled` — закрытый и нездоровый источник не запрашиваются: причину страница
 * знает и так.
 */
function useSelections(sourceId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: getSelectionsQueryKey(sourceId ?? ''),
    queryFn: () => apiFetch<SelectionsResponse>(`/selections/${sourceId}`),
    enabled: enabled && Boolean(sourceId),
    // Сервер держит подборки свежими полчаса — чаще спрашивать незачем.
    staleTime: 5 * 60_000,
  });
}

export default useSelections;

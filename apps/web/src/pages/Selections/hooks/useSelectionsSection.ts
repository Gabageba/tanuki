import { useInfiniteQuery } from '@tanstack/react-query';
import {
  SEARCH_GROUP_STATUS,
  type HomeSectionPeriod,
  type SelectionsSectionResponse,
} from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_NEXT_PAGE_ERROR_META } from '@/shared/api/errorMeta';
import { getSelectionsSectionQueryKey, SelectionsNextPageError } from '../models';

type Params = {
  sourceId: string;
  sectionId: string;
  /** Только у блока с выбором периода. */
  period: HomeSectionPeriod | undefined;
  /** Закрытый и нездоровый источник не запрашивается — причину страница знает и так. */
  enabled: boolean;
};

/**
 * Открытый блок подборок порциями. Не ответивший источник приходит статусом в первой порции —
 * страница рисует причину на месте ленты блока, вкладки остаются. Упавшая следующая порция —
 * ошибка запроса: её показывает строка подгрузки (F1), поэтому без уведомления; сбой первой
 * порции — через глобальное уведомление.
 */
function useSelectionsSection({ sourceId, sectionId, period, enabled }: Params) {
  return useInfiniteQuery({
    queryKey: getSelectionsSectionQueryKey(sourceId, sectionId, period),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (period) params.set('period', period);
      const response = await apiFetch<SelectionsSectionResponse>(
        `/selections/${sourceId}/${sectionId}?${params.toString()}`,
      );
      if (pageParam > 1 && response.status !== SEARCH_GROUP_STATUS.OK) {
        throw new SelectionsNextPageError(response.status);
      }
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    enabled,
    // Сервер держит подборки свежими полчаса — чаще спрашивать незачем.
    staleTime: 5 * 60_000,
    meta: SILENT_NEXT_PAGE_ERROR_META,
  });
}

export default useSelectionsSection;

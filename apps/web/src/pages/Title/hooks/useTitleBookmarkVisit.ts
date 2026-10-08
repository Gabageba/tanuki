import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TitleBookmarkVisitResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { BOOKMARK_FOLDERS_QUERY_KEY, BOOKMARKS_QUERY_KEY } from '@/entities/bookmark/models';

/** Сколько держится ответ визита: столько же главы помечены новыми после ухода со страницы. */
const VISIT_CACHE_MS = 30_000;

/**
 * Не под `TITLE_BOOKMARK_QUERY_KEY`: правка закладки инвалидирует его, и визит ушёл бы снова —
 * второй вернул бы пустой список, и точки новых глав погасли бы.
 */
const getVisitQueryKey = (titleId: string) => ['title-bookmark-visit', titleId] as const;

/**
 * Визит на страницу тайтла: сервер засчитывает его группе закладки и отдаёт главы, вышедшие с
 * прошлого, — они подсвечены точкой, пока страница открыта (N3). Запросом, а не мутацией: так
 * повторный монтирование и второй потребитель (список глав) берут тот же ответ, а не шлют визит
 * снова — второй визит вернул бы уже пустой список.
 */
function useTitleBookmarkVisit(titleId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: getVisitQueryKey(titleId),
    queryFn: async () => {
      const response = await apiFetch<TitleBookmarkVisitResponse>(
        `/titles/${titleId}/bookmark/visit`,
        { method: 'POST' },
      );
      // Визит снял пометку «обновился» — точка в шапке и вкладках могла погаснуть.
      void queryClient.invalidateQueries({ queryKey: BOOKMARK_FOLDERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BOOKMARKS_QUERY_KEY });
      return new Set(response.newChapterIds);
    },
    // Визит — фоновая служебная запись: о недоступном тайтле скажет сама страница, а без визита
    // просто не будет подсветки новых глав.
    meta: SILENT_ERROR_META,
    staleTime: Infinity,
    gcTime: VISIT_CACHE_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export default useTitleBookmarkVisit;

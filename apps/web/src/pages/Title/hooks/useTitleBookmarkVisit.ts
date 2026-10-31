import { type InfiniteData, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BookmarkItem,
  BookmarksResponse,
  TitleBookmarkVisitResponse,
} from '@tanuki/contracts';
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

const BOOKMARKS_LIST_QUERY_KEY = [...BOOKMARKS_QUERY_KEY, 'list'] as const;

/** Карточка группы, которой засчитан визит, — уже без новых глав. */
const clearNewChapters = (item: BookmarkItem, titleId: string): BookmarkItem =>
  item.titleId === titleId || item.otherSources.some((source) => source.titleId === titleId)
    ? { ...item, newChaptersCount: 0, latestNewAt: null }
    : item;

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
      // Список папки правится на месте, а не перезапрашивается: подгруженные прокруткой порции
      // ушли бы в скелетон, и «Назад» вернул бы к началу папки.
      queryClient.setQueriesData<InfiniteData<BookmarksResponse>>(
        { queryKey: BOOKMARKS_LIST_QUERY_KEY },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => clearNewChapters(item, titleId)),
            })),
          },
      );
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_QUERY_KEY,
        predicate: ({ queryKey }) => queryKey[1] !== BOOKMARKS_LIST_QUERY_KEY[1],
      });
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

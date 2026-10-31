import { useInfiniteQuery } from '@tanstack/react-query';
import type { BookmarksResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { BOOKMARKS_QUERY_KEY } from '@/entities/bookmark/models';
import { getBookmarkItems } from '../lib';
import type { BookmarksListParams } from '../models';

/** Закладки папки — по одной на группу подтверждённых совпадений; страницы подгружаются по мере
 *  прокрутки. */
function useBookmarks({ folderId, sort, direction, query }: BookmarksListParams) {
  return useInfiniteQuery({
    queryKey: [...BOOKMARKS_QUERY_KEY, 'list', { folderId, sort, direction, query }],
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams({ folderId, sort, direction, page: String(pageParam) });
      if (query.trim()) search.set('query', query.trim());
      return apiFetch<BookmarksResponse>(`/bookmarks?${search}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Дубли от сдвига между подгрузками не в счёт — иначе последняя закладка не подгрузится.
      const loaded = getBookmarkItems(allPages).length;
      // Пустая порция — дальше ничего нет, даже если total успел устареть.
      return lastPage.items.length > 0 && loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    // Смена поиска или сортировки — 200 мс старые карточки, потом скелетон (см. QueryBlock);
    // другая папка — скелетон сразу: её карточки не похожи на прошлые.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[2] as BookmarksListParams | undefined)?.folderId === folderId
        ? previous
        : undefined,
  });
}

export default useBookmarks;

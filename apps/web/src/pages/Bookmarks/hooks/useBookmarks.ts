import { useQuery } from '@tanstack/react-query';
import type { BookmarksResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { BOOKMARKS_QUERY_KEY } from '@/entities/bookmark/models';
import type { BookmarksListParams } from '../models';

/** Закладки папки — по одной на группу подтверждённых совпадений. */
function useBookmarks({ folderId, sort, direction, query, page }: BookmarksListParams) {
  return useQuery({
    queryKey: [...BOOKMARKS_QUERY_KEY, 'list', { folderId, sort, direction, query, page }],
    queryFn: () => {
      const search = new URLSearchParams({ folderId, sort, direction, page: String(page) });
      if (query.trim()) search.set('query', query.trim());
      return apiFetch<BookmarksResponse>(`/bookmarks?${search}`);
    },
    // Смена страницы, поиска или сортировки — 200 мс старые карточки, потом скелетон (см.
    // QueryBlock); другая папка — скелетон сразу: её карточки не похожи на прошлые.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[2] as BookmarksListParams | undefined)?.folderId === folderId
        ? previous
        : undefined,
  });
}

export default useBookmarks;

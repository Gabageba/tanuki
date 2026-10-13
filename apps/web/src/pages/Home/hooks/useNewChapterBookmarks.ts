import { useQuery } from '@tanstack/react-query';
import type { NewChapterBookmarksResponse } from '@tanuki/contracts';
import { BOOKMARKS_QUERY_KEY } from '@/entities/bookmark/models';
import { apiFetch } from '@/shared/api/client';

/** Закладки отслеживаемых папок, где вышли главы. Ключ под закладками — правка закладки
 *  (invalidateBookmarks) обновляет и этот блок. */
function useNewChapterBookmarks() {
  return useQuery({
    queryKey: [...BOOKMARKS_QUERY_KEY, 'new-chapters'],
    queryFn: () => apiFetch<NewChapterBookmarksResponse>('/bookmarks/new-chapters'),
  });
}

export default useNewChapterBookmarks;

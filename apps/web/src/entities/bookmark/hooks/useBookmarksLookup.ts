import { keepPreviousData, useQueries } from '@tanstack/react-query';
import {
  BOOKMARKS_LOOKUP_MAX_TITLES,
  type BookmarksLookupRequest,
  type BookmarksLookupResponse,
} from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { BOOKMARKS_QUERY_KEY } from '../models';

const toChunks = (titleIds: string[]) =>
  Array.from({ length: Math.ceil(titleIds.length / BOOKMARKS_LOOKUP_MAX_TITLES) }, (_, index) =>
    titleIds.slice(index * BOOKMARKS_LOOKUP_MAX_TITLES, (index + 1) * BOOKMARKS_LOOKUP_MAX_TITLES),
  );

/**
 * Папки тайтлов на странице каталога или поиска — для меток «в закладках» на карточках. Длинный
 * каталог уходит частями по лимиту запроса: подгрузка новых страниц перезапрашивает только
 * последнюю часть.
 */
function useBookmarksLookup(titleIds: string[]) {
  return useQueries({
    queries: toChunks(titleIds).map((chunk) => ({
      queryKey: [...BOOKMARKS_QUERY_KEY, 'lookup', chunk],
      queryFn: () =>
        apiFetch<BookmarksLookupResponse>('/bookmarks/lookup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ titleIds: chunk } satisfies BookmarksLookupRequest),
        }),
      // Подгрузка следующей страницы каталога не должна гасить метки уже показанных карточек.
      placeholderData: keepPreviousData,
    })),
    combine: (results): BookmarksLookupResponse =>
      Object.assign({}, ...results.map(({ data }) => data)),
  });
}

export default useBookmarksLookup;

import type { TFunction } from 'i18next';
import { readEnumParam } from '@/shared/lib/searchParams';
import {
  BOOKMARK_SORT,
  SORT_DIRECTION,
  getDefaultBookmarkSortDirection,
  type BookmarkSort,
  type BookmarksResponse,
} from '@tanuki/contracts';

export const getBookmarkSortLabel = (sort: BookmarkSort, t: TFunction) => {
  switch (sort) {
    case BOOKMARK_SORT.UPDATED:
      return t('byUpdate');
    case BOOKMARK_SORT.READ:
      return t('byReading');
    case BOOKMARK_SORT.ADDED:
      return t('byDateAdded');
    case BOOKMARK_SORT.ALPHABETICAL:
      return t('alphabetically');
  }
};

/** Карточки подгруженных порций по одной на тайтл: если закладку переложили между подгрузками,
 *  сдвиг смещения отдаёт её в двух соседних порциях. */
export const getBookmarkItems = (pages: BookmarksResponse[]) => [
  ...new Map(
    pages.flatMap(({ items }) => items).map((bookmark) => [bookmark.titleId, bookmark]),
  ).values(),
];

export const readBookmarksParams = (params: URLSearchParams) => {
  const sort = readEnumParam(params, 'sort', BOOKMARK_SORT, BOOKMARK_SORT.UPDATED);
  return {
    query: params.get('query') ?? '',
    sort,
    direction: readEnumParam(
      params,
      'direction',
      SORT_DIRECTION,
      getDefaultBookmarkSortDirection(sort),
    ),
  };
};

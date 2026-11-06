import type { TFunction } from 'i18next';
import { BOOKMARK_SORT, type BookmarkSort, type BookmarksResponse } from '@tanuki/contracts';

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

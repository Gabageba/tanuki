import {
  BOOKMARK_SORT,
  getDefaultBookmarkSortDirection,
  type BookmarkSort,
  type SortDirection,
} from '@tanuki/contracts';

export type BookmarksListParams = {
  folderId: string;
  sort: BookmarkSort;
  direction: SortDirection;
  query: string;
  page: number;
};

/** Поиск, сортировка и страница открытой папки. Живут в `PageLayout.params`, а не в самом
 *  содержимом: скелетон страницы при перезапросе папок его размонтирует, а выбранное остаётся. */
export type BookmarksParams = {
  /** Папка, к которой относятся поиск и страница; другая папка начинает их с начала. */
  folderId: string | undefined;
  query: string;
  sort: BookmarkSort;
  direction: SortDirection;
  page: number;
};

export const INITIAL_BOOKMARKS_PARAMS: BookmarksParams = {
  folderId: undefined,
  query: '',
  sort: BOOKMARK_SORT.UPDATED,
  direction: getDefaultBookmarkSortDirection(BOOKMARK_SORT.UPDATED),
  page: 1,
};

/** Место справа от названия под точку: точка 8px и зазор 6px — она влезает и за полной строкой. */
export const NEW_DOT_SPACE = 14;

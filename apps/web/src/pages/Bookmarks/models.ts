import type { BookmarkSort, SortDirection } from '@tanuki/contracts';

export type BookmarksListParams = {
  folderId: string;
  sort: BookmarkSort;
  direction: SortDirection;
  query: string;
  page: number;
};

/** Место справа от названия под точку: точка 8px и зазор 6px — она влезает и за полной строкой. */
export const NEW_DOT_SPACE = 14;

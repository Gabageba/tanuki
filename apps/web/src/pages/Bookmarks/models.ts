import type { BookmarkSort, SortDirection } from '@tanuki/contracts';

export type BookmarksListParams = {
  folderId: string;
  sort: BookmarkSort;
  direction: SortDirection;
  query: string;
};

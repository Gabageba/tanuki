export type PageLayoutBaseQuery = {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

export type PageLayoutRefreshableQuery = PageLayoutBaseQuery & {
  refresh: () => unknown;
};

export type PageLayoutPaginatedQuery = PageLayoutBaseQuery & {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
};

export type PageLayoutBaseQuery = {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
};

export type PageLayoutRefreshableQuery = PageLayoutBaseQuery & {
  refresh: () => unknown;
};

export type PageLayoutPaginatedQuery = PageLayoutBaseQuery & {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
};

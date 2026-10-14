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
  /** Следующая страница не загрузилась — на месте подгрузки строка с повтором. */
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
};

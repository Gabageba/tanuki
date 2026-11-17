import type { LoadingQuery } from '../QueryBlock/models';

/** Запрос страницы: по нему `Content` решает, показать скелетон, «Нет соединения» или ошибку. */
export type PageLayoutBaseQuery = LoadingQuery & {
  isPending: boolean;
  /** Особое ручное обновление, например сброс страниц и обход кеша каталога. */
  refresh?: () => unknown;
};

export type PageLayoutPaginatedQuery = PageLayoutBaseQuery & {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Следующая страница не загрузилась — на месте подгрузки строка с повтором. */
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
};

/** Именованные запросы страницы (`PageLayout useQueries`): каждый читается по имени, а загрузку и
 *  ошибку страницы Content считает по всем сразу. */
export type PageLayoutQueries = Record<string, PageLayoutBaseQuery>;

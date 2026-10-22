import { useState, type ReactNode } from 'react';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import Content from './components/Content';
import PullToRefresh from './components/PullToRefresh';
import InfiniteScrollTrigger from './components/InfiniteScrollTrigger';
import useQuery from './hooks/useQuery';
import useQueries from './hooks/useQueries';
import useParams from './hooks/useParams';
import useNoQuery from './hooks/useNoQuery';
import {
  PageLayoutParamsContext,
  PageLayoutQueriesContext,
  PageLayoutQueryContext,
  PageLayoutStatusContext,
} from './context';
import { mergePageQueries } from './lib';
import type { PageLayoutBaseQuery, PageLayoutQueries } from './models';

type Props<TQuery extends PageLayoutBaseQuery, TQueries extends PageLayoutQueries, TParams> = {
  /** Главный запрос страницы — читается через `PageLayout.useQuery`. */
  useQuery?: (params: TParams) => TQuery;
  /** Вместо главного — несколько именованных, читаются через `PageLayout.useQueries`; Content
   *  ждёт их все. */
  useQueries?: (params: TParams) => TQueries;
  /** Содержимому нужны все `useQueries`: упавший любой — экран ошибки страницы. Без него страница
   *  падает, только когда упали все, а упавший один показывает пустым свой блок. */
  requireAll?: boolean;
  params?: TParams;
  children: ReactNode;
};

function PageLayout<
  TQuery extends PageLayoutBaseQuery,
  TQueries extends PageLayoutQueries,
  TParams = undefined,
>({
  useQuery,
  useQueries,
  requireAll = false,
  params: initialParams = {} as TParams,
  children,
}: Props<TQuery, TQueries, TParams>) {
  const [params, setParams] = useState<TParams>(initialParams);
  const usePageQuery: (params: TParams) => TQuery | null = useQuery ?? useNoQuery;
  const usePageQueries: (params: TParams) => TQueries | null = useQueries ?? useNoQuery;
  const query = usePageQuery(params);
  const queries = usePageQueries(params);
  const status = queries ? mergePageQueries(Object.values(queries), requireAll) : query;

  return (
    <PageLayoutQueryContext.Provider value={query}>
      <PageLayoutQueriesContext.Provider value={queries}>
        <PageLayoutStatusContext.Provider value={status}>
          <PageLayoutParamsContext.Provider
            value={{ params, setParams: setParams as (params: unknown) => void }}
          >
            {children}
          </PageLayoutParamsContext.Provider>
        </PageLayoutStatusContext.Provider>
      </PageLayoutQueriesContext.Provider>
    </PageLayoutQueryContext.Provider>
  );
}

PageLayout.Header = Header;
PageLayout.Breadcrumbs = Breadcrumbs;
PageLayout.PullToRefresh = PullToRefresh;
PageLayout.InfiniteScrollTrigger = InfiniteScrollTrigger;
PageLayout.Content = Content;
PageLayout.useQuery = useQuery;
PageLayout.useQueries = useQueries;
PageLayout.useParams = useParams;

export default PageLayout;

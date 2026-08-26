import { useState, type ReactNode } from 'react';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import Content from './components/Content';
import PullToRefresh from './components/PullToRefresh';
import InfiniteScrollTrigger from './components/InfiniteScrollTrigger';
import ErrorNotification from './components/ErrorNotification';
import useQuery from './hooks/useQuery';
import useParams from './hooks/useParams';
import { PageLayoutParamsContext, PageLayoutQueryContext } from './context';
import type { PageLayoutBaseQuery } from './models';

type Props<TQuery extends PageLayoutBaseQuery, TParams> = {
  useQuery: (params: TParams) => TQuery;
  params?: TParams;
  children: ReactNode;
};

function PageLayout<TQuery extends PageLayoutBaseQuery, TParams = undefined>({
  useQuery,
  params: initialParams = {} as TParams,
  children,
}: Props<TQuery, TParams>) {
  const [params, setParams] = useState<TParams>(initialParams);
  const query = useQuery(params);

  return (
    <PageLayoutQueryContext.Provider value={query}>
      <PageLayoutParamsContext.Provider
        value={{ params, setParams: setParams as (params: unknown) => void }}
      >
        {children}
      </PageLayoutParamsContext.Provider>
    </PageLayoutQueryContext.Provider>
  );
}

PageLayout.Header = Header;
PageLayout.Breadcrumbs = Breadcrumbs;
PageLayout.PullToRefresh = PullToRefresh;
PageLayout.InfiniteScrollTrigger = InfiniteScrollTrigger;
PageLayout.ErrorNotification = ErrorNotification;
PageLayout.Content = Content;
PageLayout.useQuery = useQuery;
PageLayout.useParams = useParams;

export default PageLayout;

import type { ReactNode } from 'react';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import Content from './components/Content';
import PullToRefresh from './components/PullToRefresh';
import InfiniteScrollTrigger from './components/InfiniteScrollTrigger';
import ErrorNotification from './components/ErrorNotification';
import { PageLayoutQueryContext } from './context';
import type { PageLayoutBaseQuery } from './models';

type Props<TQuery extends PageLayoutBaseQuery, TParams extends readonly unknown[]> = {
  useQuery: (...params: TParams) => TQuery;
  params: TParams;
  children: ReactNode;
};

function PageLayout<TQuery extends PageLayoutBaseQuery, TParams extends readonly unknown[]>({
  useQuery,
  params,
  children,
}: Props<TQuery, TParams>) {
  const query = useQuery(...params);

  return (
    <PageLayoutQueryContext.Provider value={query}>{children}</PageLayoutQueryContext.Provider>
  );
}

PageLayout.Header = Header;
PageLayout.Breadcrumbs = Breadcrumbs;
PageLayout.PullToRefresh = PullToRefresh;
PageLayout.InfiniteScrollTrigger = InfiniteScrollTrigger;
PageLayout.ErrorNotification = ErrorNotification;
PageLayout.Content = Content;

export default PageLayout;

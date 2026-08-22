import { useContext } from 'react';
import { PageLayoutQueryContext } from '../context';
import type { PageLayoutBaseQuery } from '../models';

function usePageLayoutQuery<TQuery extends PageLayoutBaseQuery = PageLayoutBaseQuery>() {
  const query = useContext(PageLayoutQueryContext);
  if (!query) {
    throw new Error('usePageLayoutQuery must be used within PageLayout');
  }
  return query as TQuery;
}

export default usePageLayoutQuery;

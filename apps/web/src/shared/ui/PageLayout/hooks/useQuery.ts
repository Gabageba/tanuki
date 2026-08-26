import { useContext } from 'react';
import { PageLayoutQueryContext } from '../context';
import type { PageLayoutBaseQuery } from '../models';

function useQuery<TQuery extends PageLayoutBaseQuery = PageLayoutBaseQuery>() {
  const query = useContext(PageLayoutQueryContext);
  if (!query) {
    throw new Error('PageLayout.useQuery must be used within PageLayout');
  }
  return query as TQuery;
}

export default useQuery;

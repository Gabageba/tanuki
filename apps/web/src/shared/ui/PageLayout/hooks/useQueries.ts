import { useContext } from 'react';
import { PageLayoutQueriesContext } from '../context';
import type { PageLayoutQueries } from '../models';

/** Именованные запросы страницы; тип — по хуку, переданному в `PageLayout useQueries`:
 *  `const { user } = PageLayout.useQueries<typeof useProfileQueries>()`. */
function useQueries<THook extends (params: never) => PageLayoutQueries>() {
  const queries = useContext(PageLayoutQueriesContext);
  if (!queries) {
    throw new Error(
      'PageLayout.useQueries must be used within PageLayout with the useQueries prop',
    );
  }
  return queries as ReturnType<THook>;
}

export default useQueries;

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as InternalQueryClientProvider,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiRequestError } from '@/shared/api/client';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

/**
 * Сессия могла протухнуть, пока человек уже был на странице — любой 401, где бы он ни пришёл,
 * обнуляет закешированного `me`, и RequireAuth на следующем рендере уводит на /login.
 */
const handlePossibleSessionExpiry = (error: unknown) => {
  if (error instanceof ApiRequestError && error.status === 401) {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
  }
};

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handlePossibleSessionExpiry }),
  mutationCache: new MutationCache({ onError: handlePossibleSessionExpiry }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type Props = {
  children: ReactNode;
};

function QueryClientProvider({ children }: Props) {
  return <InternalQueryClientProvider client={queryClient}>{children}</InternalQueryClientProvider>;
}

export default QueryClientProvider;

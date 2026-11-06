import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';
import { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';
import { readSettings } from '@/shared/lib/settings';

type Props = { children: ReactNode };

/** Переиспользованные компоненты получают локальные настройки и гостевое состояние.
 * Запросы выключены; кеш настоящей сессии приложения остаётся за пределами песочницы. */
function PlaygroundProviders({ children }: Props) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          enabled: false,
          staleTime: Infinity,
          retry: false,
          refetchOnWindowFocus: false,
        },
        mutations: { retry: false },
      },
    });
    client.setQueryData(CURRENT_USER_QUERY_KEY, null);
    client.setQueryData(USER_SETTINGS_QUERY_KEY, readSettings());
    return client;
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default PlaygroundProviders;

import {
  hashKey,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as InternalQueryClientProvider,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import { readErrorMeta } from '@/shared/api/errorMeta';
import { I18N } from '@/shared/lib/i18n';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';

const isSessionExpired = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.UNAUTHORIZED;

/**
 * Сессия протухла, пока человек был на странице: разлогиниваем на клиенте. Обнулённый `me`
 * заставляет RequireAuth увести на /login?redirect=…, откуда после входа вернёмся обратно.
 * Остальной кеш — данные прошлой сессии, его выкидываем. Гость (`me` уже null) и повторные 401
 * от соседних запросов сюда не проходят.
 */
const logOutExpiredSession = () => {
  if (!queryClient.getQueryData(CURRENT_USER_QUERY_KEY)) return;

  queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
  const currentUserHash = hashKey(CURRENT_USER_QUERY_KEY);
  queryClient.removeQueries({ predicate: (query) => query.queryHash !== currentUserHash });
  notifications.show({ color: 'red', message: I18N.t('sessionExpiredLogInAgain') });
};

/** Текст ошибки API уже переведён сервером; всё прочее — сбой на фронте, его текст не для людей. */
const showErrorNotification = (error: unknown, title = I18N.t('error')) =>
  notifications.show({
    color: 'red',
    title,
    message: error instanceof ApiRequestError ? error.message : I18N.t('somethingWentWrong'),
  });

/** 4xx не лечится повтором — ретраим только сбои сервера и сети, и только один раз. */
const shouldRetry = (failureCount: number, error: unknown) =>
  failureCount < 1 && !(error instanceof ApiRequestError && error.status < 500 && error.status > 0);

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isSessionExpired(error)) {
        logOutExpiredSession();
        return;
      }
      const { silentError, errorTitle } = readErrorMeta(query.meta);
      if (silentError) return;
      showErrorNotification(error, errorTitle);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (isSessionExpired(error)) {
        logOutExpiredSession();
        return;
      }
      const { silentError, errorTitle } = readErrorMeta(mutation.meta);
      if (silentError) return;
      showErrorNotification(error, errorTitle);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: shouldRetry,
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

import {
  hashKey,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as InternalQueryClientProvider,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { API_ERROR_CODE, type CurrentUser } from '@tanuki/contracts';
import {
  ApiRequestError,
  isAdultContentHiddenError,
  isNetworkError,
  isSourceAccountRequiredError,
} from '@/shared/api/client';
import { readErrorMeta } from '@/shared/api/errorMeta';
import { I18N } from '@/shared/lib/i18n';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';
import { dropBrowserPushSubscription } from '@/entities/notification/push';
import { writeLastUser } from '@/entities/user/lastUser';
import { API_CACHE_NAME } from '@/shared/lib/serviceWorkerConstants';

const CURRENT_USER_HASH = hashKey(CURRENT_USER_QUERY_KEY);

const isSessionExpired = (error: unknown) =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODE.UNAUTHORIZED;

/**
 * Сессия протухла, пока человек был на странице: разлогиниваем на клиенте. Обнулённый `me`
 * заставляет RequireAuth увести на /login?redirect=…, откуда после входа вернёмся обратно.
 * Остальной кеш — данные прошлой сессии, его выкидываем. Гость (`me` уже null) и повторные 401
 * от соседних запросов сюда не проходят. Push-подписка привязана к аккаунту — снимаем её в браузере,
 * иначе устройство получало бы push прошлой сессии и показывало их следующему, кто войдёт.
 */
const logOutExpiredSession = () => {
  if (!queryClient.getQueryData(CURRENT_USER_QUERY_KEY)) return;

  queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
  queryClient.removeQueries({ predicate: (query) => query.queryHash !== CURRENT_USER_HASH });
  void dropBrowserPushSubscription().catch(() => undefined);
  notifications.show({ color: 'red', message: I18N.t('sessionExpiredLogInAgain') });
};

/** Без сети о недоступном говорит полоса «Нет сети» и пустые состояния — тост на каждый запрос
 *  лишний. */
const isOfflineError = (error: unknown) => isNetworkError(error) && !navigator.onLine;

/** Текст ошибки API уже переведён сервером; всё прочее — сбой на фронте, его текст не для людей. */
const showErrorNotification = (error: unknown, title = I18N.t('error')) =>
  notifications.show({
    color: 'red',
    title,
    message: error instanceof ApiRequestError ? error.message : I18N.t('somethingWentWrong'),
  });

/** 4xx не лечится повтором — ретраим только сбои сервера и сети, и только один раз. */
const shouldRetry = (failureCount: number, error: unknown) =>
  failureCount < 1 &&
  !(error instanceof ApiRequestError && error.status < 500 && error.status > 0) &&
  // Без сети повтор в режиме offlineFirst встал бы на паузу до её появления, и блок висел бы в
  // загрузке вместо пустого состояния.
  !isOfflineError(error);

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isSessionExpired(error)) {
        logOutExpiredSession();
        return;
      }
      const { silentError, silentNextPageError, errorTitle } = readErrorMeta(query.meta);
      if (silentNextPageError && query.state.fetchMeta?.fetchMore?.direction === 'forward') {
        return;
      }
      // Закрытый источник и скрытый контент 18+ объясняет экран QueryError со своей кнопкой —
      // уведомление лишнее.
      if (
        silentError ||
        isOfflineError(error) ||
        isSourceAccountRequiredError(error) ||
        isAdultContentHiddenError(error)
      ) {
        return;
      }
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
      if (silentError || isOfflineError(error)) return;
      showErrorNotification(error, errorTitle);
    },
  }),
  defaultOptions: {
    queries: {
      // Без сети запрос всё равно уходит: ответ может дать кеш service worker или снимок
      // скачанного. В режиме 'online' TanStack без сети ставил бы его на паузу, не спросив.
      networkMode: 'offlineFirst',
      // Пока данные моложе пяти минут, они показываются сразу и не перезапрашиваются; старше —
      // перезапрос на монтировании и при возврате во вкладку, со скелетоном (см. QueryBlock).
      staleTime: 5 * 60_000,
      retry: shouldRetry,
    },
  },
});

/**
 * Кто вошёл — следом за кешем `me`, откуда бы он ни менялся (вход, выход, правка профиля, 401):
 * по сохранённому пользователю приложение пускает без сети. Вышел — ответы API в кеше воркера
 * становятся чужими для следующего, кто войдёт; скачанное остаётся в базе своего пользователя.
 */
queryClient.getQueryCache().subscribe((event) => {
  if (event.type !== 'updated' || event.query.queryHash !== CURRENT_USER_HASH) return;
  const user = event.query.state.data as CurrentUser | null | undefined;
  if (user === undefined) return;
  writeLastUser(user);
  if (user === null && 'caches' in window) void caches.delete(API_CACHE_NAME);
});

type Props = {
  children: ReactNode;
};

function QueryClientProvider({ children }: Props) {
  return <InternalQueryClientProvider client={queryClient}>{children}</InternalQueryClientProvider>;
}

export default QueryClientProvider;

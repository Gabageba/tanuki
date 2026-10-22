import type { FetchStatus } from '@tanstack/react-query';
import { isNetworkError } from '@/shared/api/client';
import type { LoadingQuery, QueryLoad } from './models';

/** Запрос за содержимым, который должен показать скелетон: не подгрузка следующей порции и не
 *  тихий перезапрос живых данных. */
const isContentFetching = (query: LoadingQuery) =>
  query.fetchStatus === 'fetching' && !query.isFetchingNextPage && !query.isLive;

const mergeFetchStatus = (queries: readonly LoadingQuery[]): FetchStatus => {
  if (queries.some((query) => query.fetchStatus === 'paused' && query.data === undefined)) {
    return 'paused';
  }
  return queries.some(isContentFetching) ? 'fetching' : 'idle';
};

/** Несколько запросов как один: ошибка — когда хоть один упал, ничего не загрузив; «Нет
 *  соединения» — когда хоть один на паузе без данных; данные — массив, когда загрузились все. */
export const mergeQueries = (queries: readonly LoadingQuery[]): LoadingQuery<unknown[]> => {
  const failed = queries.find((query) => query.isError && query.data === undefined);

  return {
    data: queries.every((query) => query.data !== undefined)
      ? queries.map((query) => query.data)
      : undefined,
    isError: Boolean(failed),
    error: failed?.error ?? null,
    isPlaceholderData: queries.some((query) => query.isPlaceholderData),
    fetchStatus: mergeFetchStatus(queries),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
};

/**
 * Запрос, без которого блок обойдётся: пока он грузится, блок ждёт его, как любой другой, но
 * упавший отдаёт `null` вместо данных, и блок рисуется без него, а не уходит в `empty`.
 */
export const toOptionalQuery = <TData>(query: LoadingQuery<TData>): LoadingQuery<TData | null> =>
  query.isError && query.data === undefined && query.fetchStatus === 'idle'
    ? { ...query, data: null, isError: false, error: null }
    : query;

/** Один запрос блока как есть, несколько — объединённые `mergeQueries`. */
export const toLoadingQuery = (query: LoadingQuery | readonly LoadingQuery[]): LoadingQuery =>
  'fetchStatus' in query ? query : mergeQueries(query);

/**
 * Что ждёт запрос. Причину перезапроса механизм не различает — фокус вкладки, инвалидация после
 * мутации и смена параметров одинаково значат, что показанное может быть устаревшим. Различает
 * только, есть ли что показать: нет — скелетон сразу, есть — после задержки. Тихо идут только
 * подгрузка следующей порции и перезапрос живых данных; без сети показывается то, что есть.
 */
export const getQueryLoad = (query: LoadingQuery): QueryLoad => {
  const hasData = query.data !== undefined;
  const isPaused = query.fetchStatus === 'paused';
  const isFetching = query.fetchStatus === 'fetching';
  const isRefetching = isFetching && !query.isFetchingNextPage && !query.isLive;
  // Запросы идут и без сети (`offlineFirst`): ответ может дать кеш воркера. Не нашёлся — запрос
  // падает сетевой ошибкой, это не сбой.
  const isOfflineError = query.isError && isNetworkError(query.error) && !navigator.onLine;
  const isOffline = !hasData && (isPaused || isOfflineError);

  return {
    isOffline,
    isFailed: query.isError && !hasData && !isFetching && !isPaused && !isOffline,
    // Данных нет и без ошибки — в том числе выключенный запрос, ждущий соседний (источник для
    // каталога): показать всё равно нечего.
    isEmptyWait: !hasData && !isPaused && (isFetching || !query.isError),
    isStaleWait: hasData && !isPaused && (isRefetching || query.isPlaceholderData),
  };
};

/** Верх блока ушёл под шапку — поднимаем его в видимую область. Отступ под липкую шапку задаёт
 *  `scroll-margin-top` блока. */
export const scrollBlockIntoView = (element: HTMLElement | null) => {
  if (!element) return;
  const offset = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
  if (element.getBoundingClientRect().top < offset) {
    element.scrollIntoView({ block: 'start' });
  }
};

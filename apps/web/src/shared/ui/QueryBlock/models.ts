import type { FetchStatus } from '@tanstack/react-query';

/** Сколько при смене параметров остаётся старое содержимое: быстрый ответ подменяет его без
 *  скелетона. */
export const SKELETON_DELAY_MS = 200;

/** Сколько держится скелетон, показанный после задержки, — чтобы не мелькал. */
export const SKELETON_MIN_MS = 400;

/** Состояние запроса TanStack Query, по которому механизм загрузки решает, что показать. Результат
 *  `useQuery`/`useInfiniteQuery` подходит как есть. */
export type LoadingQuery<TData = unknown> = {
  data: TData | undefined;
  isError: boolean;
  error: Error | null;
  /** Вместо данных новых параметров показаны старые (`keepPreviousData`). */
  isPlaceholderData: boolean;
  fetchStatus: FetchStatus;
  /** Подгрузка следующей порции — её показывает `InfiniteScrollTrigger`, не скелетон. */
  isFetchingNextPage?: boolean;
  /** Живые данные (опрос по таймеру, SSE): перезапрос тихий, показанное актуально. */
  isLive?: boolean;
  refetch: () => unknown;
};

/** Запрос блока: один или несколько — массивом. */
export type QueryBlockQuery = LoadingQuery | readonly LoadingQuery[];

/** Данные загруженного блока: у одного запроса — его данные, у нескольких — кортеж их данных в том
 *  же порядке. */
export type QueryBlockData<TQuery extends QueryBlockQuery> = TQuery extends readonly LoadingQuery[]
  ? { -readonly [K in keyof TQuery]: LoadedData<TQuery[K]> }
  : LoadedData<TQuery>;

/** Данные одного загруженного запроса — уже без `undefined`. */
type LoadedData<TQuery> = TQuery extends LoadingQuery ? Exclude<TQuery['data'], undefined> : never;

/** Что ждёт запрос — см. `getQueryLoad`. */
export type QueryLoad = {
  /** Сети нет, запрос на паузе, данных нет. */
  isOffline: boolean;
  /** Запрос упал, данных нет. */
  isFailed: boolean;
  /** Данных нет, ответ ещё будет: скелетон сразу. */
  isEmptyWait: boolean;
  /** Данные на экране, но идёт запрос за новыми: скелетон после задержки. */
  isStaleWait: boolean;
};

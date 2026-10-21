import { Box } from '@mantine/core';
import type { ReactNode } from 'react';
import OfflineState from '../OfflineState';
import useSkeletonTiming from './hooks/useSkeletonTiming';
import { toLoadingQuery } from './lib';
import type { QueryBlockData, QueryBlockQuery } from './models';

type Props<TQuery extends QueryBlockQuery> = {
  /** Запрос блока; несколько — массивом: блок ждёт все, данные приходят кортежем в том же
   *  порядке. */
  query: TQuery;
  /** Раскладка блока скелетоном — пока ждём ответ. */
  skeleton: ReactNode;
  /** Пустое состояние блока: ответ пуст (`isEmpty`) или запрос упал без данных (об ошибке скажет
   *  глобальный тост). */
  empty?: ReactNode;
  /** Пуст ли загруженный ответ — тогда вместо содержимого `empty`. */
  isEmpty?: (data: QueryBlockData<TQuery>) => boolean;
  /** Без сети и без данных; по умолчанию «Нет соединения». Блок страницы, которая сама скажет
   *  «Нет соединения», оставляет свой скелетон. */
  offline?: ReactNode;
  children: (data: QueryBlockData<TQuery>) => ReactNode;
};

/**
 * Блок со своим запросом. Когда показать скелетон, решает общий механизм (`useSkeletonTiming`), а не
 * блок: сразу, пока данных нет, и через 200 мс, когда на экране старые. Без сети и без данных —
 * «Нет соединения»; упал без данных или ответ пуст (`isEmpty`) — `empty`. Содержимое получает уже
 * загруженные непустые данные.
 */
function QueryBlock<const TQuery extends QueryBlockQuery>({
  query: blockQuery,
  skeleton,
  empty = null,
  isEmpty,
  offline,
  children,
}: Props<TQuery>) {
  const query = toLoadingQuery(blockQuery);
  const { ref, isSkeleton, isOffline, isFailed } = useSkeletonTiming<HTMLDivElement>(query);

  let content: ReactNode = skeleton;
  if (isOffline) {
    content = offline === undefined ? <OfflineState onRetry={query.refetch} /> : offline;
  } else if (isFailed) {
    content = empty;
  } else if (!isSkeleton && query.data !== undefined) {
    const data = query.data as QueryBlockData<TQuery>;
    content = isEmpty?.(data) ? empty : children(data);
  }

  return (
    <Box
      ref={ref}
      style={{
        scrollMarginTop: 'calc(var(--app-shell-header-height) + var(--mantine-spacing-md))',
      }}
    >
      {content}
    </Box>
  );
}

export default QueryBlock;

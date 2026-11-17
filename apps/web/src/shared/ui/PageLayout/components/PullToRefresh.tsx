import { Center, Loader } from '@mantine/core';
import { useContext } from 'react';
import { PageLayoutQueryContext, PageLayoutStatusContext } from '../context';
import usePullToRefresh from '../hooks/usePullToRefresh';

type Props = {
  /** Обновить и запросы вложенных блоков, которые не входят в запрос страницы. */
  onRefresh?: () => unknown;
};

function PullToRefresh({ onRefresh }: Props) {
  const query = useContext(PageLayoutQueryContext);
  const status = useContext(PageLayoutStatusContext);
  const refresh = onRefresh ?? query?.refresh ?? status?.refetch;
  const { pullDistance, isRefreshing } = usePullToRefresh(refresh);

  const height = isRefreshing ? 40 : pullDistance;
  if (height === 0) return null;

  return (
    <Center
      style={{ height, overflow: 'hidden', transition: isRefreshing ? 'height 0.2s' : undefined }}
    >
      <Loader size="sm" opacity={isRefreshing ? 1 : Math.min(pullDistance / 40, 1)} />
    </Center>
  );
}

export default PullToRefresh;

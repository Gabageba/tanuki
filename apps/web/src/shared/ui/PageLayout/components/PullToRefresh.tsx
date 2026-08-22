import { Center, Loader } from '@mantine/core';
import usePageLayoutQuery from '../hooks/usePageLayoutQuery';
import usePullToRefresh from '../hooks/usePullToRefresh';
import type { PageLayoutRefreshableQuery } from '../models';

function PullToRefresh() {
  const { refresh } = usePageLayoutQuery<PageLayoutRefreshableQuery>();
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

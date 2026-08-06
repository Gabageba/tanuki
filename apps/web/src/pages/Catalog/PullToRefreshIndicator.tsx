import { Center, Loader } from '@mantine/core';

type Props = {
  pullDistance: number;
  isRefreshing: boolean;
};

function PullToRefreshIndicator({ pullDistance, isRefreshing }: Props) {
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

export default PullToRefreshIndicator;

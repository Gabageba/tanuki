import { Center, Loader } from '@mantine/core';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
}: PullToRefreshIndicatorProps) {
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

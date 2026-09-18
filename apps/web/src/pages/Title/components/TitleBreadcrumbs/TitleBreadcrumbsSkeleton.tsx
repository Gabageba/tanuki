import { Group, Skeleton } from '@mantine/core';

function TitleBreadcrumbsSkeleton() {
  return (
    <Group gap={8} justify="space-between">
      <Skeleton h={14} flex={1} />
      <Skeleton h={14} w={140} />
    </Group>
  );
}

export default TitleBreadcrumbsSkeleton;

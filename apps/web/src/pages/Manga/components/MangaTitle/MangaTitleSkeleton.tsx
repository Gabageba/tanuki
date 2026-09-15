import { Group, Skeleton, Stack } from '@mantine/core';
import MangaBreadcrumbsSkeleton from '../MangaBreadcrumbs/MangaBreadcrumbsSkeleton';

function MangaTitleSkeleton() {
  return (
    <Stack gap="sm">
      <MangaBreadcrumbsSkeleton />
      <Stack gap={8}>
        <Group gap={8}>
          <Skeleton h={30} flex={1} />
          <Skeleton h={20} w={30} radius="sm" />
        </Group>
        <Group gap={8}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} h={14} w={250} />
          ))}
        </Group>
      </Stack>
    </Stack>
  );
}

export default MangaTitleSkeleton;

import { Group, Skeleton, Stack } from '@mantine/core';
import MangaBreadcrumbsSkeleton from '../MangaBreadcrumbs/MangaBreadcrumbsSkeleton';

function MangaTitleSkeleton() {
  return (
    <>
      <MangaBreadcrumbsSkeleton />
      <Stack gap={8}>
        <Skeleton h={34} w="100%" />
        <Group gap={8}>
          <Skeleton h={16} w={250} />
          <Skeleton h={16} w={250} />
        </Group>
      </Stack>
    </>
  );
}

export default MangaTitleSkeleton;

import { Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleBreadcrumbsSkeleton from '../TitleBreadcrumbs/TitleBreadcrumbsSkeleton';

function TitleNameSkeleton() {
  return (
    <Stack gap="sm">
      <TitleBreadcrumbsSkeleton />
      <Stack gap={8}>
        <Group gap={8} wrap="nowrap" align="flex-start">
          <TextSkeleton fz={30} lh="tight" flex={1} />
          <Skeleton h={20} w={30} radius="sm" />
        </Group>
        <Group gap={8}>
          {Array.from({ length: 2 }).map((_, index) => (
            <TextSkeleton key={index} lh="tight" w={250} />
          ))}
        </Group>
      </Stack>
    </Stack>
  );
}

export default TitleNameSkeleton;

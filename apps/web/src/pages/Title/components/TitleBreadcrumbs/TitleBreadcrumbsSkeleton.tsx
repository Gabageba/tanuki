import { Group } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function TitleBreadcrumbsSkeleton() {
  return (
    <Group gap={8} justify="space-between" wrap="nowrap">
      <TextSkeleton fz={12} lh="tight" flex={1} />
      <TextSkeleton fz={12} lh="tight" w={140} />
    </Group>
  );
}

export default TitleBreadcrumbsSkeleton;

import { Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function TitleReadingActionsSkeleton() {
  return (
    <Stack gap={8}>
      <Skeleton h={36} />
      <Group gap={8}>
        <Skeleton h={5} flex={1} />
        <TextSkeleton fz={12} w={45} />
      </Group>
    </Stack>
  );
}

export default TitleReadingActionsSkeleton;

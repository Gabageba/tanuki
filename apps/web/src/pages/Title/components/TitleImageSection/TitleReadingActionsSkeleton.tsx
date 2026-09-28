import { Group, Skeleton, Stack } from '@mantine/core';

function TitleReadingActionsSkeleton() {
  return (
    <Stack gap={8}>
      <Skeleton h={36} />
      <Group gap={8}>
        <Skeleton h={5} flex={1} />
        <Skeleton h={18.59} w={45} />
      </Group>
    </Stack>
  );
}

export default TitleReadingActionsSkeleton;

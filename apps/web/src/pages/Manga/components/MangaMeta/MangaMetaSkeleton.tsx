import { Divider, Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';

function MangaMetaSkeleton() {
  return (
    <Group align="flex-start" gap="lg">
      <Stack gap={4}>
        <Skeleton h={12} w="70%" />
        <Skeleton h={64} w={90} />
      </Stack>
      <Divider orientation="vertical" />
      <SimpleGrid cols={3} flex={1}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Stack gap={8} key={index}>
            <Skeleton h={12} w="70%" />

            <Skeleton w="100%" h={14} />
          </Stack>
        ))}
      </SimpleGrid>
    </Group>
  );
}

export default MangaMetaSkeleton;

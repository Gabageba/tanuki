import { Divider, SimpleGrid, Skeleton, Stack } from '@mantine/core';

function TitleInfoSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton w={250} h={16} my={4} />
      <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="lg">
        {Array.from({ length: 6 }).map((_, index) => (
          <Stack key={index} gap="sm">
            <Skeleton h={14} w={100} />
            <Divider />
            {Array.from({ length: 4 }).map((_, index) => (
              <Stack key={index} gap={8}>
                <Skeleton h={12} w={120} />
                <Skeleton h={14} />
              </Stack>
            ))}
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default TitleInfoSkeleton;

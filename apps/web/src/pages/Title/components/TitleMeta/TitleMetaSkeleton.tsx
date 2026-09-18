import { Divider, Flex, SimpleGrid, Skeleton, Stack } from '@mantine/core';

function TitleMetaSkeleton() {
  return (
    <Flex
      align="flex-start"
      gap={{ base: 'md', xs: 'lg' }}
      direction={{ base: 'column', xs: 'row' }}
    >
      <Stack gap={4}>
        <Skeleton h={12} w="70%" />
        <Skeleton h={64} w={90} />
      </Stack>
      <Divider orientation="vertical" visibleFrom="xs" />
      <Divider orientation="horizontal" hiddenFrom="xs" w="100%" />
      <SimpleGrid cols={{ base: 2, sm: 3 }} flex={1} w="100%">
        {Array.from({ length: 6 }).map((_, index) => (
          <Stack gap={8} key={index}>
            <Skeleton h={12} w="70%" />
            <Skeleton w="100%" h={14} />
          </Stack>
        ))}
      </SimpleGrid>
    </Flex>
  );
}

export default TitleMetaSkeleton;

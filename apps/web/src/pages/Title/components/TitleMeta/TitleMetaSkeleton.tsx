import { Divider, Flex, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function TitleMetaSkeleton() {
  return (
    <Flex
      align="flex-start"
      gap={{ base: 'md', xs: 'lg' }}
      direction={{ base: 'column', xs: 'row' }}
    >
      <Stack gap={4}>
        <TextSkeleton fz={12} lh="tight" w="70%" />
        <Skeleton h={64} w={90} />
      </Stack>
      <Divider orientation="vertical" visibleFrom="xs" />
      <Divider orientation="horizontal" hiddenFrom="xs" w="100%" />
      <SimpleGrid cols={{ base: 2, sm: 3 }} flex={1} w="100%">
        {Array.from({ length: 6 }).map((_, index) => (
          <Stack gap={8} key={index}>
            <TextSkeleton fz="xs" lh="tight" w="70%" />
            <TextSkeleton lh="tight" />
          </Stack>
        ))}
      </SimpleGrid>
    </Flex>
  );
}

export default TitleMetaSkeleton;

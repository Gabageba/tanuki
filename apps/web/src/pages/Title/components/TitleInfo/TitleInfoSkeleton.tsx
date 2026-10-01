import { Divider, SimpleGrid, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function TitleInfoSkeleton() {
  return (
    <Stack gap="md">
      <TextSkeleton fz="h5" lh="h5" w={250} />
      <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="lg">
        {Array.from({ length: 6 }).map((_, index) => (
          <Stack key={index} gap="sm">
            <TextSkeleton fz={12} lh="tight" w={100} />
            <Divider />
            {Array.from({ length: 4 }).map((_, index) => (
              <Stack key={index} gap={8}>
                <TextSkeleton fz={12} lh="tight" w={120} />
                <TextSkeleton lh={1.2} />
              </Stack>
            ))}
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default TitleInfoSkeleton;

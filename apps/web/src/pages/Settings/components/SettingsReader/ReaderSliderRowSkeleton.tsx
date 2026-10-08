import { Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Отступ ползунка и пресетов под текст строки — как `CONTENT_OFFSET` у GroupedListRow. */
const CONTENT_OFFSET = 40;

/** Заглушка ReaderSliderRow: строка со значением справа, под ней ползунок и три пресета. */
function ReaderSliderRowSkeleton() {
  return (
    <Stack gap="xs" px="md" py="xs">
      <Group gap="md" wrap="nowrap">
        <Skeleton w={24} h={24} radius="sm" flex="none" />
        <Stack gap={4} flex={1}>
          <TextSkeleton fz={14} lh="tight" w="40%" />
          <TextSkeleton fz={12} lh="tight" w="60%" />
        </Stack>
        <TextSkeleton fz={14} lh="tight" w={48} />
      </Group>
      <Stack gap="xs" pl={CONTENT_OFFSET}>
        <Skeleton h={20} />
        <SimpleGrid cols={3} spacing={8}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} h={34} />
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}

export default ReaderSliderRowSkeleton;

import { Box, Group, Skeleton } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function SourceTitleSkeleton() {
  return (
    <Group flex={1} miw={0} wrap="nowrap">
      <Skeleton w={40} h={40} flex="none" />
      {/* Как у SourceTitle: колонка текста сжимается, а не выталкивает соседей из строки. */}
      <Box flex={1} miw={0} maw={250}>
        <TextSkeleton fz="h5" lh="h5" />
        <TextSkeleton size="sm" w="40%" />
      </Box>
    </Group>
  );
}

export default SourceTitleSkeleton;

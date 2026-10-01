import { Box, Group, Skeleton } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function SourceTitleSkeleton() {
  return (
    <Group flex={1} wrap="nowrap">
      <Skeleton w={40} h={40} flex="none" />
      <Box>
        <TextSkeleton fz="h5" lh="h5" w={250} />
        <TextSkeleton size="sm" w={100} />
      </Box>
    </Group>
  );
}

export default SourceTitleSkeleton;

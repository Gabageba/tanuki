import { AspectRatio, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function TitleGridCardSkeleton() {
  return (
    <Stack gap={8}>
      <AspectRatio ratio={3 / 4}>
        <Skeleton h="100%" />
      </AspectRatio>
      <Stack gap={4}>
        <TextSkeleton fz={12} lh="tight" w="70%" />
        <TextSkeleton lh="tight" lines={2} />
      </Stack>
    </Stack>
  );
}

export default TitleGridCardSkeleton;

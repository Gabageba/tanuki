import { AspectRatio, Skeleton, Stack } from '@mantine/core';

function TitleGridCardSkeleton() {
  return (
    <Stack gap={8}>
      <AspectRatio ratio={3 / 4}>
        <Skeleton h="100%" />
      </AspectRatio>
      <Stack gap={6}>
        <Skeleton h={12} />
        <Skeleton h={28} />
      </Stack>
    </Stack>
  );
}

export default TitleGridCardSkeleton;

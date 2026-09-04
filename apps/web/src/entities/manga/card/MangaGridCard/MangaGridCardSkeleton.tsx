import { Skeleton, Stack } from '@mantine/core';

function MangaGridCardSkeleton() {
  return (
    <Stack gap={8}>
      <Skeleton
        w="100%"
        style={{
          aspectRatio: '3 / 4',
        }}
      />
      <Stack gap={6}>
        <Skeleton h={12} />
        <Skeleton h={28} />
      </Stack>
    </Stack>
  );
}

export default MangaGridCardSkeleton;

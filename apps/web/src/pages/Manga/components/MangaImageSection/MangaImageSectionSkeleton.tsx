import { AspectRatio, Grid, Group, Skeleton, Stack } from '@mantine/core';

function MangaImageSectionSkeleton() {
  return (
    <Grid.Col span={3}>
      <Stack gap={16}>
        <AspectRatio ratio={3 / 4}>
          <Skeleton />
        </AspectRatio>
        <Stack gap={8}>
          <Skeleton h={36} />
          <Group gap={8}>
            <Skeleton h={5} flex={1} />
            <Skeleton h={18.59} w={45} />
          </Group>
          <Skeleton h={36} />
          <Group gap={8}>
            <Skeleton h={36} flex={1} />
            <Skeleton h={36} w={36} />
            <Skeleton h={36} w={36} />
          </Group>
        </Stack>
        <Skeleton h={40.59} />
      </Stack>
    </Grid.Col>
  );
}

export default MangaImageSectionSkeleton;

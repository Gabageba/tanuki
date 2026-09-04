import { Group, Skeleton } from '@mantine/core';

const SKELETON_WIDTHS = [50, 40];

function MangaCardTagsSkeleton() {
  return (
    <Group gap={6} flex={1}>
      {SKELETON_WIDTHS.map((width) => (
        <Skeleton key={width} h={20} w={width} radius="sm" style={{ flexShrink: 0 }} />
      ))}
    </Group>
  );
}

export default MangaCardTagsSkeleton;

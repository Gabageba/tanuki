import { Card, Group, Skeleton, Stack } from '@mantine/core';
import MangaCardTagsSkeleton from '../MangaCardTags/MangaCardTagsSkeleton';

function MangaListCardSkeleton() {
  return (
    <Card withBorder p={0}>
      <Group align="start" gap={0}>
        <Skeleton h={160} w={120} />
        <Stack p="sm" h="100%" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <Skeleton h={12} />
            <Skeleton h={18} />
            <Skeleton h={56} />
          </Stack>
          <Group gap={8}>
            <MangaCardTagsSkeleton />
            <Skeleton w={54} h={25} />
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

export default MangaListCardSkeleton;

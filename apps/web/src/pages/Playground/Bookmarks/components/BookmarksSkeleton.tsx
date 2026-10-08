import { Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import TitleGridCardSkeleton from '@/entities/title/card/TitleGridCard/TitleGridCardSkeleton';

type Props = {
  cols: number;
};

/** Загрузка /bookmarks: полоса вкладок, строка поиска и сетка карточек в той же раскладке. */
function BookmarksSkeleton({ cols }: Props) {
  return (
    <Stack gap="md">
      <Group gap="lg" wrap="nowrap" style={{ overflow: 'hidden' }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} h={20} w={100} flex="none" />
        ))}
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Skeleton h={36} flex={1} maw={320} />
        <Skeleton h={36} w={136} />
      </Group>
      <SimpleGrid cols={cols} spacing="md">
        {Array.from({ length: cols }, (_, index) => (
          <TitleGridCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default BookmarksSkeleton;

import { Grid, Group, Skeleton, Stack } from '@mantine/core';
import type { ViewMode } from '@/shared/lib/viewMode';
import BookmarksGridSkeleton from './BookmarksGridSkeleton';

type Props = {
  viewMode: ViewMode;
};

/** Загрузка /bookmarks: полоса вкладок, строка поиска и сетка карточек в той же раскладке. */
function BookmarksSkeleton({ viewMode }: Props) {
  return (
    <Stack gap="md">
      <Group gap="lg" wrap="nowrap" style={{ overflow: 'hidden' }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} h={20} w={100} flex="none" />
        ))}
      </Group>
      <Grid gap="xs">
        <Grid.Col span={{ base: 12, sm: 'auto' }}>
          <Skeleton h={36} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 'content' }}>
          <Group gap="xs" wrap="nowrap">
            <Skeleton h={36} flex={{ base: 1, sm: 'none' }} w={{ xs: 210 }} />
            <Skeleton h={36} w={76} flex="none" />
          </Group>
        </Grid.Col>
      </Grid>
      <BookmarksGridSkeleton viewMode={viewMode} />
    </Stack>
  );
}

export default BookmarksSkeleton;

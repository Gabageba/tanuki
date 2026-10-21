import { Grid, Group, Skeleton } from '@mantine/core';

/** Поиск, сортировка и вид скелетоном — в той же сетке, что и `BookmarksToolbar`. */
function BookmarksToolbarSkeleton() {
  return (
    <Grid gap="xs">
      <Grid.Col span={{ base: 12, sm: 'auto' }}>
        <Skeleton h={36} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 'content' }}>
        <Group gap="xs" wrap="nowrap">
          <Skeleton h={36} flex={{ base: 1, sm: 'none' }} w={{ sm: 210 }} />
          <Skeleton h={36} w={78} flex="none" />
        </Group>
      </Grid.Col>
    </Grid>
  );
}

export default BookmarksToolbarSkeleton;

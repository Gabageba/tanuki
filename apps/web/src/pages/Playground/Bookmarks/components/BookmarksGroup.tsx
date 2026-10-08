import { Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { CARD_VARIANT, type MockBookmark } from '../models';
import BookmarkGridCard from './BookmarkGridCard';

type Props = {
  title: string;
  bookmarks: MockBookmark[];
  cols: number | { base: number; sm: number; lg: number };
};

/** Подпись группы и её сетка; пустая группа не показывается. */
function BookmarksGroup({ title, bookmarks, cols }: Props) {
  if (bookmarks.length === 0) return null;

  return (
    <Stack gap="sm">
      <Group gap={6}>
        <Text fw={600} fz="sm">
          {title}
        </Text>
        <Text ff="monospace" fz="sm" c="dimmed">
          {bookmarks.length}
        </Text>
      </Group>
      <SimpleGrid cols={cols} spacing="md">
        {bookmarks.map((bookmark) => (
          <BookmarkGridCard key={bookmark.id} bookmark={bookmark} variant={CARD_VARIANT.GROUPED} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default BookmarksGroup;

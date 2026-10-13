import { SimpleGrid } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import NewChapterBookmarksEmpty from './NewChapterBookmarksEmpty';
import NewChapterRow from './NewChapterRow';

type Props = {
  items: BookmarkItem[];
};

/** Строки «Новых глав» в две колонки на десктопе и в одну на телефоне; нет глав — пустое
 *  состояние. */
function NewChapterBookmarksList({ items }: Props) {
  if (!items.length) {
    return <NewChapterBookmarksEmpty />;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="xs">
      {items.map((bookmark) => (
        <NewChapterRow key={bookmark.titleId} bookmark={bookmark} />
      ))}
    </SimpleGrid>
  );
}

export default NewChapterBookmarksList;

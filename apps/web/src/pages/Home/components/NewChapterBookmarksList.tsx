import { SimpleGrid } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import NewChapterBookmarksEmpty from './NewChapterBookmarksEmpty';
import NewChapterRow from './NewChapterRow';

type Props = {
  items: BookmarkItem[];
};

/** Строки «Новых глав» в две колонки на десктопе и в одну на телефоне; нет глав — пустое
 *  состояние. */
function NewChapterBookmarksList({ items }: Props) {
  const { data: folders } = useBookmarkFolders();

  if (!items.length) {
    return <NewChapterBookmarksEmpty />;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {items.map((bookmark) => (
        <NewChapterRow
          key={bookmark.titleId}
          bookmark={bookmark}
          folder={folders?.items.find(({ id }) => id === bookmark.folderId) ?? null}
        />
      ))}
    </SimpleGrid>
  );
}

export default NewChapterBookmarksList;

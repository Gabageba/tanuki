import { useDisclosure } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import { invalidateBookmarks } from '@/entities/bookmark/lib';
import ImportFromSourceModal from '@/features/source-import/ImportFromSourceModal';
import PageLayout from '@/shared/ui/PageLayout';
import BookmarksContent from './components/BookmarksContent';
import BookmarksSkeleton from './components/BookmarksSkeleton';

function Bookmarks() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Модалка импорта — над содержимым: после импорта закладки появляются, пустое состояние и
  // скелетон перезапроса сменяют друг друга, а шаг «Готово» должен остаться на экране.
  const [isImportOpened, { open: openImport, close: closeImport }] = useDisclosure(false);

  return (
    <PageLayout useQuery={useBookmarkFolders}>
      <PageLayout.PullToRefresh onRefresh={() => invalidateBookmarks(queryClient)} />
      <PageLayout.Content title={t('bookmarks')} skeleton={<BookmarksSkeleton />}>
        <BookmarksContent onImport={openImport} />
      </PageLayout.Content>
      <ImportFromSourceModal opened={isImportOpened} onClose={closeImport} />
    </PageLayout>
  );
}

export default Bookmarks;

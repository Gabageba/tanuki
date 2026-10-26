import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import ImportFromSourceModal from '@/features/source-import/ImportFromSourceModal';
import PageLayout from '@/shared/ui/PageLayout';
import BookmarksContent from './components/BookmarksContent';
import BookmarksSkeleton from './components/BookmarksSkeleton';
import { INITIAL_BOOKMARKS_PARAMS } from './models';

function Bookmarks() {
  const { t } = useTranslation();
  // Модалка импорта — над содержимым: после импорта закладки появляются, пустое состояние и
  // скелетон перезапроса сменяют друг друга, а шаг «Готово» должен остаться на экране.
  const [isImportOpened, { open: openImport, close: closeImport }] = useDisclosure(false);

  return (
    <PageLayout useQuery={useBookmarkFolders} params={INITIAL_BOOKMARKS_PARAMS}>
      <PageLayout.Content title={t('bookmarks')} skeleton={<BookmarksSkeleton />}>
        <BookmarksContent onImport={openImport} />
      </PageLayout.Content>
      <ImportFromSourceModal opened={isImportOpened} onClose={closeImport} />
    </PageLayout>
  );
}

export default Bookmarks;

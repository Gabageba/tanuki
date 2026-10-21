import { useTranslation } from 'react-i18next';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import PageLayout from '@/shared/ui/PageLayout';
import BookmarksContent from './components/BookmarksContent';
import BookmarksSkeleton from './components/BookmarksSkeleton';
import { INITIAL_BOOKMARKS_PARAMS } from './models';

function Bookmarks() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useBookmarkFolders} params={INITIAL_BOOKMARKS_PARAMS}>
      <PageLayout.Content title={t('bookmarks')} skeleton={<BookmarksSkeleton />}>
        <BookmarksContent />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Bookmarks;

import { useTranslation } from 'react-i18next';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import PageLayout from '@/shared/ui/PageLayout';
import BookmarksContent from './components/BookmarksContent';

function Bookmarks() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useBookmarkFolders}>
      <PageLayout.Content title={t('bookmarks')} showLoading={false}>
        <BookmarksContent />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Bookmarks;

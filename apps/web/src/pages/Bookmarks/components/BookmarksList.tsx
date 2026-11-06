import { Stack } from '@mantine/core';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import useBookmarks from '../hooks/useBookmarks';
import { getBookmarkItems } from '../lib';
import type { BookmarksListParams } from '../models';
import BookmarkCard from './BookmarkCard';
import BookmarkCardSkeleton from './BookmarkCardSkeleton';
import FolderEmpty from './FolderEmpty';
import SearchEmpty from './SearchEmpty';

type Props = {
  params: BookmarksListParams;
  viewMode: ViewMode;
  onResetQuery: () => void;
};

/**
 * Карточки открытой папки: первая порция — скелетоном, дальше — по прокрутке. Упавший запрос
 * сообщает глобальный тост — здесь пустое состояние.
 */
function BookmarksList({ params, viewMode, onResetQuery }: Props) {
  const query = useBookmarks(params);

  const empty = params.query.trim() ? <SearchEmpty onReset={onResetQuery} /> : <FolderEmpty />;

  return (
    <QueryBlock
      query={query}
      skeleton={
        <TitleCardsGridSkeleton
          viewMode={viewMode}
          skeleton={<BookmarkCardSkeleton viewMode={viewMode} />}
        />
      }
      empty={empty}
      isEmpty={({ pages }) => pages.every(({ items }) => items.length === 0)}
    >
      {({ pages }) => (
        <Stack gap={0}>
          <ViewModeGrid viewMode={viewMode}>
            {getBookmarkItems(pages).map((bookmark) => (
              <BookmarkCard key={bookmark.titleId} bookmark={bookmark} viewMode={viewMode} />
            ))}
          </ViewModeGrid>
          <PageLayout.InfiniteScrollTrigger query={query} />
        </Stack>
      )}
    </QueryBlock>
  );
}

export default BookmarksList;

import { Stack } from '@mantine/core';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import useBookmarks from '../hooks/useBookmarks';
import type { BookmarksListParams } from '../models';
import BookmarkCards from './BookmarkCards';
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
          virtualized
          viewMode={viewMode}
          skeleton={<BookmarkCardSkeleton viewMode={viewMode} />}
        />
      }
      empty={empty}
      isEmpty={({ pages }) => pages.every(({ items }) => items.length === 0)}
    >
      {({ pages }) => (
        <Stack gap={0}>
          <BookmarkCards pages={pages} viewMode={viewMode} />
          <PageLayout.InfiniteScrollTrigger query={query} />
        </Stack>
      )}
    </QueryBlock>
  );
}

export default BookmarksList;

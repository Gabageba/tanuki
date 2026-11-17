import { useMemo } from 'react';
import type { BookmarksResponse } from '@tanuki/contracts';
import type { ViewMode } from '@/shared/lib/viewMode';
import VirtualizedViewModeGrid from '@/shared/ui/VirtualizedViewModeGrid';
import { getBookmarkItems } from '../lib';
import BookmarkCard from './BookmarkCard';

type Props = {
  pages: BookmarksResponse[];
  viewMode: ViewMode;
};

function BookmarkCards({ pages, viewMode }: Props) {
  // Стабильные элементы сохраняют уже видимые карточки при смене диапазона виртуализации.
  const cards = useMemo(
    () =>
      getBookmarkItems(pages).map((bookmark) => (
        <BookmarkCard key={bookmark.titleId} bookmark={bookmark} viewMode={viewMode} />
      )),
    [pages, viewMode],
  );

  return <VirtualizedViewModeGrid viewMode={viewMode}>{cards}</VirtualizedViewModeGrid>;
}

export default BookmarkCards;

import { useEffect } from 'react';
import { Stack } from '@mantine/core';
import { BOOKMARKS_PAGE_SIZE } from '@tanuki/contracts';
import type { ViewMode } from '@/shared/lib/viewMode';
import BlockLoader from '@/shared/ui/BlockLoader';
import ListPagination from '@/shared/ui/ListPagination';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import useBookmarks from '../hooks/useBookmarks';
import type { BookmarksListParams } from '../models';
import BookmarkCard from './BookmarkCard';
import FolderEmpty from './FolderEmpty';
import SearchEmpty from './SearchEmpty';

type Props = {
  params: BookmarksListParams;
  viewMode: ViewMode;
  onPageChange: (page: number) => void;
  onResetQuery: () => void;
};

/** Карточки открытой папки. Упавший запрос сообщает глобальный тост — здесь пустое состояние. */
function BookmarksList({ params, viewMode, onPageChange, onResetQuery }: Props) {
  const { data, isPending, isPlaceholderData } = useBookmarks(params);
  const isPastLastPage = !!data && !isPlaceholderData && data.items.length === 0 && data.total > 0;

  // Последнюю карточку страницы перенесли или убрали — открывается последняя непустая страница,
  // а не «папка пуста» при живых закладках.
  useEffect(() => {
    if (isPastLastPage) onPageChange(Math.ceil(data.total / BOOKMARKS_PAGE_SIZE));
  }, [isPastLastPage, data, onPageChange]);

  // Папка или выдача поиска вполне может оказаться пустой — спиннер, а не сетка-скелетон.
  if (isPending || isPastLastPage) {
    return <BlockLoader />;
  }

  if (!data || data.items.length === 0) {
    return params.query.trim() ? <SearchEmpty onReset={onResetQuery} /> : <FolderEmpty />;
  }

  return (
    <Stack gap="md">
      <ViewModeGrid viewMode={viewMode}>
        {data.items.map((bookmark) => (
          <BookmarkCard key={bookmark.titleId} bookmark={bookmark} viewMode={viewMode} />
        ))}
      </ViewModeGrid>
      <ListPagination
        page={data.page}
        total={data.total}
        pageSize={BOOKMARKS_PAGE_SIZE}
        onChange={onPageChange}
      />
    </Stack>
  );
}

export default BookmarksList;

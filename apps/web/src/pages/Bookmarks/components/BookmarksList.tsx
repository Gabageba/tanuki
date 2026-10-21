import { useEffect } from 'react';
import { Stack } from '@mantine/core';
import { BOOKMARKS_PAGE_SIZE } from '@tanuki/contracts';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import ListPagination from '@/shared/ui/ListPagination';
import QueryBlock from '@/shared/ui/QueryBlock';
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
  const query = useBookmarks(params);
  const { data, isPlaceholderData } = query;
  const isPastLastPage = !!data && !isPlaceholderData && data.items.length === 0 && data.total > 0;

  // Последнюю карточку страницы перенесли или убрали — открывается последняя непустая страница,
  // а не «папка пуста» при живых закладках.
  useEffect(() => {
    if (isPastLastPage) onPageChange(Math.ceil(data.total / BOOKMARKS_PAGE_SIZE));
  }, [isPastLastPage, data, onPageChange]);

  const skeleton = <TitleCardsGridSkeleton viewMode={viewMode} />;
  const empty = params.query.trim() ? <SearchEmpty onReset={onResetQuery} /> : <FolderEmpty />;

  return (
    <QueryBlock
      query={query}
      skeleton={skeleton}
      empty={empty}
      isEmpty={({ total }) => total === 0}
    >
      {({ items, page, total }) => {
        // Закладки в папке есть, а на этой странице нет — ждём переход на последнюю непустую.
        if (items.length === 0) return skeleton;
        return (
          <Stack gap="md">
            <ViewModeGrid viewMode={viewMode}>
              {items.map((bookmark) => (
                <BookmarkCard key={bookmark.titleId} bookmark={bookmark} viewMode={viewMode} />
              ))}
            </ViewModeGrid>
            <ListPagination
              page={page}
              total={total}
              pageSize={BOOKMARKS_PAGE_SIZE}
              onChange={onPageChange}
            />
          </Stack>
        );
      }}
    </QueryBlock>
  );
}

export default BookmarksList;

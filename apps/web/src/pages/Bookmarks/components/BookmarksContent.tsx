import { useEffect, useState } from 'react';
import { Stack } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import {
  BOOKMARK_SORT,
  getDefaultBookmarkSortDirection,
  type BookmarkSort,
  type SortDirection,
} from '@tanuki/contracts';
import type useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import { BOOKMARKS_FOLDER_SEARCH_PARAM } from '@/shared/lib/routes';
import {
  getStoredViewMode,
  setStoredViewMode,
  VIEW_MODE,
  type ViewMode,
} from '@/shared/lib/viewMode';
import PageLayout from '@/shared/ui/PageLayout';
import BookmarksEmpty from './BookmarksEmpty';
import BookmarksList from './BookmarksList';
import BookmarksSkeleton from './BookmarksSkeleton';
import BookmarksToolbar from './BookmarksToolbar';
import FolderTabs from './FolderTabs';

/** Задержка поиска: запрос уходит, когда человек перестал печатать. */
const SEARCH_DEBOUNCE_MS = 300;

/** Вкладки-папки, поиск и сортировка, карточки открытой папки. */
function BookmarksContent() {
  const { data: folders, isPending } = PageLayout.useQuery<ReturnType<typeof useBookmarkFolders>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  // Сброс поиска (кнопкой или сменой папки) применяется сразу, без задержки набора.
  const listQuery = query ? debouncedQuery : '';
  const [sort, setSort] = useState<BookmarkSort>(BOOKMARK_SORT.UPDATED);
  const [direction, setDirection] = useState<SortDirection>(
    getDefaultBookmarkSortDirection(BOOKMARK_SORT.UPDATED),
  );
  const [page, setPage] = useState(1);
  // Вид общий с каталогом: читается из настроек и пишется туда же.
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? VIEW_MODE.GRID);

  const items = folders?.items ?? [];
  const folderParam = searchParams.get(BOOKMARKS_FOLDER_SEARCH_PARAM);
  const activeFolder = items.find(({ id }) => id === folderParam) ?? items[0];
  const activeFolderId = activeFolder?.id;

  // Другая папка — поиск и страница с начала, откуда бы ни пришла смена: вкладка, иконка
  // закладок в шапке или удалённая папка в адресе.
  const [listFolderId, setListFolderId] = useState(activeFolderId);
  if (listFolderId !== activeFolderId) {
    setListFolderId(activeFolderId);
    setQuery('');
    setPage(1);
  }

  // Без папки в адресе (или с удалённой) открывается первая — и сразу попадает в адрес.
  useEffect(() => {
    if (!activeFolderId || folderParam === activeFolderId) return;
    setSearchParams({ [BOOKMARKS_FOLDER_SEARCH_PARAM]: activeFolderId }, { replace: true });
  }, [activeFolderId, folderParam, setSearchParams]);

  if (isPending) {
    return <BookmarksSkeleton viewMode={viewMode} />;
  }

  const isEmpty = items.every(({ count }) => count === 0);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleViewModeChange = (value: ViewMode) => {
    setStoredViewMode(value);
    setViewMode(value);
  };

  const handleFolderChange = (folderId: string) => {
    setSearchParams({ [BOOKMARKS_FOLDER_SEARCH_PARAM]: folderId }, { replace: true });
  };

  return (
    <Stack gap="md">
      {activeFolder && (
        <FolderTabs folders={items} activeId={activeFolder.id} onChange={handleFolderChange} />
      )}
      {isEmpty || !activeFolder ? (
        <BookmarksEmpty />
      ) : (
        <>
          <BookmarksToolbar
            query={query}
            onQueryChange={handleQueryChange}
            sort={sort}
            onSortChange={(value) => {
              // У каждой сортировки своё естественное направление: алфавит — от «А», даты — свежие.
              setSort(value);
              setDirection(getDefaultBookmarkSortDirection(value));
              setPage(1);
            }}
            direction={direction}
            onDirectionChange={(value) => {
              setDirection(value);
              setPage(1);
            }}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <BookmarksList
            params={{ folderId: activeFolder.id, sort, direction, query: listQuery, page }}
            viewMode={viewMode}
            onPageChange={setPage}
            onResetQuery={() => handleQueryChange('')}
          />
        </>
      )}
    </Stack>
  );
}

export default BookmarksContent;

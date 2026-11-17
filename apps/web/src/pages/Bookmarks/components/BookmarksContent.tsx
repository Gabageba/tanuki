import { useEffect, useMemo, useState } from 'react';
import { Stack } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import { getDefaultBookmarkSortDirection } from '@tanuki/contracts';
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
import BookmarksToolbar from './BookmarksToolbar';
import FolderTabs from './FolderTabs';
import { readBookmarksParams } from '../lib';
import useUrlState from '@/shared/hooks/useUrlState';
import SwipeableTabs from '@/shared/ui/SwipeableTabs';

/** Задержка поиска: запрос уходит, когда человек перестал печатать. */
const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  onImport: () => void;
};

/** Вкладки-папки, поиск и сортировка, карточки открытой папки. */
function BookmarksContent({ onImport }: Props) {
  const { data: folders } = PageLayout.useQuery<ReturnType<typeof useBookmarkFolders>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setParams } = useUrlState(readBookmarksParams);
  // Вид общий с каталогом: читается из настроек и пишется туда же.
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? VIEW_MODE.GRID);

  const items = folders?.items ?? [];
  const folderParam = searchParams.get(BOOKMARKS_FOLDER_SEARCH_PARAM);
  const activeFolder = items.find(({ id }) => id === folderParam) ?? items[0];
  const activeFolderId = activeFolder?.id;

  const { query, sort, direction } = params;

  // Набор отложен вместе с папкой: строка, набранная в прежней папке, в запрос новой не уходит.
  const search = useMemo(() => ({ folderId: activeFolderId, query }), [activeFolderId, query]);
  const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  // Сброс поиска (кнопкой или сменой папки) применяется сразу, без задержки набора.
  const listQuery =
    query && debouncedSearch.folderId === activeFolderId ? debouncedSearch.query : '';

  // Без папки в адресе (или с удалённой) открывается первая — и сразу попадает в адрес.
  useEffect(() => {
    if (!activeFolderId || folderParam === activeFolderId) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(BOOKMARKS_FOLDER_SEARCH_PARAM, activeFolderId);
        return next;
      },
      { replace: true },
    );
  }, [activeFolderId, folderParam, setSearchParams]);

  const isEmpty = items.every(({ count }) => count === 0);

  const handleQueryChange = (value: string) => {
    setParams({ query: value });
  };

  const handleViewModeChange = (value: ViewMode) => {
    setStoredViewMode(value);
    setViewMode(value);
  };

  const handleFolderChange = (folderId: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(BOOKMARKS_FOLDER_SEARCH_PARAM, folderId);
        next.delete('query');
        return next;
      },
      { replace: true, flushSync: true },
    );
  };

  return (
    <SwipeableTabs
      value={activeFolderId ?? null}
      onChange={(value) => value && handleFolderChange(value)}
    >
      <Stack gap="md">
        <FolderTabs folders={items} />
        {isEmpty || !activeFolder ? (
          <BookmarksEmpty onImport={onImport} />
        ) : (
          <>
            <BookmarksToolbar
              query={query}
              onQueryChange={handleQueryChange}
              sort={sort}
              onSortChange={(value) => {
                // У каждой сортировки своё естественное направление: алфавит — от «А», даты — свежие.
                setParams({
                  sort: value,
                  direction: getDefaultBookmarkSortDirection(value),
                });
              }}
              direction={direction}
              onDirectionChange={(value) => setParams({ direction: value })}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
            <BookmarksList
              params={{ folderId: activeFolder.id, sort, direction, query: listQuery }}
              viewMode={viewMode}
              onResetQuery={() => handleQueryChange('')}
            />
          </>
        )}
      </Stack>
    </SwipeableTabs>
  );
}

export default BookmarksContent;

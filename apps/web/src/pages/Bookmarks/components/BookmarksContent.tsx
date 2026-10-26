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
import type { BookmarksParams } from '../models';

/** Задержка поиска: запрос уходит, когда человек перестал печатать. */
const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  onImport: () => void;
};

/** Вкладки-папки, поиск и сортировка, карточки открытой папки. */
function BookmarksContent({ onImport }: Props) {
  const { data: folders } = PageLayout.useQuery<ReturnType<typeof useBookmarkFolders>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setParams } = PageLayout.useParams<BookmarksParams>();
  // Вид общий с каталогом: читается из настроек и пишется туда же.
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? VIEW_MODE.GRID);

  const items = folders?.items ?? [];
  const folderParam = searchParams.get(BOOKMARKS_FOLDER_SEARCH_PARAM);
  const activeFolder = items.find(({ id }) => id === folderParam) ?? items[0];
  const activeFolderId = activeFolder?.id;

  // Другая папка — поиск и страница с начала, откуда бы ни пришла смена: вкладка, иконка
  // закладок в шапке или удалённая папка в адресе. Пока params не догнали папку, сброшенные
  // значения берутся сразу; затем они записываются, чтобы прежняя папка не вернула свой поиск.
  const isSameFolder = params.folderId === activeFolderId;
  const query = isSameFolder ? params.query : '';
  const page = isSameFolder ? params.page : 1;
  const { sort, direction } = params;
  const updateParams = (patch: Partial<BookmarksParams>) =>
    setParams({ ...params, folderId: activeFolderId, query, page, ...patch });

  // Набор отложен вместе с папкой: строка, набранная в прежней папке, в запрос новой не уходит.
  const search = useMemo(() => ({ folderId: activeFolderId, query }), [activeFolderId, query]);
  const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  // Сброс поиска (кнопкой или сменой папки) применяется сразу, без задержки набора.
  const listQuery =
    query && debouncedSearch.folderId === activeFolderId ? debouncedSearch.query : '';

  useEffect(() => {
    if (isSameFolder) return;
    setParams({ ...params, folderId: activeFolderId, query: '', page: 1 });
  }, [isSameFolder, params, activeFolderId, setParams]);

  // Без папки в адресе (или с удалённой) открывается первая — и сразу попадает в адрес.
  useEffect(() => {
    if (!activeFolderId || folderParam === activeFolderId) return;
    setSearchParams({ [BOOKMARKS_FOLDER_SEARCH_PARAM]: activeFolderId }, { replace: true });
  }, [activeFolderId, folderParam, setSearchParams]);

  const isEmpty = items.every(({ count }) => count === 0);

  const handleQueryChange = (value: string) => {
    updateParams({ query: value, page: 1 });
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
        <BookmarksEmpty onImport={onImport} />
      ) : (
        <>
          <BookmarksToolbar
            query={query}
            onQueryChange={handleQueryChange}
            sort={sort}
            onSortChange={(value) => {
              // У каждой сортировки своё естественное направление: алфавит — от «А», даты — свежие.
              updateParams({
                sort: value,
                direction: getDefaultBookmarkSortDirection(value),
                page: 1,
              });
            }}
            direction={direction}
            onDirectionChange={(value) => updateParams({ direction: value, page: 1 })}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <BookmarksList
            params={{ folderId: activeFolder.id, sort, direction, query: listQuery, page }}
            viewMode={viewMode}
            onPageChange={(value) => updateParams({ page: value })}
            onResetQuery={() => handleQueryChange('')}
          />
        </>
      )}
    </Stack>
  );
}

export default BookmarksContent;

import { useState } from 'react';
import { SimpleGrid, Stack, Title } from '@mantine/core';
import ListPagination from '@/shared/ui/ListPagination';
import { resolveFolder } from '../lib';
import { MOCK_BOOKMARKS, MOCK_FOLDERS } from '../mocks';
import {
  ACTIONS_PLACEMENT,
  BUILT_IN_STYLE,
  CARD_VARIANT,
  type ActionsPlacement,
  type BuiltInStyle,
  type CardVariant,
  type MockBookmark,
  type SourcesVariant,
  type TabCounter,
  type UnavailableVariant,
} from '../models';
import BookmarkGridCard from './BookmarkGridCard';
import BookmarksToolbar from './BookmarksToolbar';
import FolderEmpty from './FolderEmpty';
import FolderTabs from './FolderTabs';

type Props = {
  tabCounter: TabCounter;
  actionsPlacement: ActionsPlacement;
  builtInStyle?: BuiltInStyle;
  /** Рамка телефона: две колонки и четыре карточки. */
  compact?: boolean;
  cardVariant?: CardVariant;
  unavailableVariant?: UnavailableVariant;
  sourcesVariant?: SourcesVariant;
  bookmarks?: MockBookmark[];
};

/** Страница /bookmarks целиком: вкладки-папки, поиск и сортировка, сетка карточек (по умолчанию C1). */
function BookmarksPageMock({
  tabCounter,
  actionsPlacement,
  builtInStyle = BUILT_IN_STYLE.SEMANTIC,
  compact = false,
  cardVariant = CARD_VARIANT.COVER_BADGE,
  unavailableVariant,
  sourcesVariant,
  bookmarks: allBookmarks = MOCK_BOOKMARKS,
}: Props) {
  const [activeId, setActiveId] = useState('reading');
  const folders = MOCK_FOLDERS.map((folder) => resolveFolder(folder, builtInStyle));
  const activeFolder = folders.find(({ id }) => id === activeId);
  const bookmarks = compact ? allBookmarks.slice(0, 4) : allBookmarks;

  return (
    <Stack gap="md">
      <Title order={compact ? 3 : 2}>Закладки</Title>
      <FolderTabs
        folders={folders}
        counter={tabCounter}
        activeId={activeId}
        onChange={setActiveId}
        withActions={actionsPlacement === ACTIONS_PLACEMENT.TABS}
      />
      <BookmarksToolbar
        withActions={actionsPlacement === ACTIONS_PLACEMENT.TOOLBAR}
        compact={compact}
      />
      {activeFolder?.count === 0 ? (
        <FolderEmpty />
      ) : (
        <>
          <SimpleGrid cols={compact ? 2 : { base: 2, sm: 3, lg: 5 }} spacing="md">
            {bookmarks.map((bookmark) => (
              <BookmarkGridCard
                key={bookmark.id}
                bookmark={bookmark}
                variant={cardVariant}
                unavailableVariant={unavailableVariant}
                sourcesVariant={sourcesVariant}
              />
            ))}
          </SimpleGrid>
          <ListPagination
            page={1}
            total={activeFolder?.count ?? 0}
            pageSize={bookmarks.length}
            onChange={() => undefined}
          />
        </>
      )}
    </Stack>
  );
}

export default BookmarksPageMock;

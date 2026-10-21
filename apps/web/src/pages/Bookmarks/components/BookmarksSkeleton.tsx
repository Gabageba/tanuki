import { Skeleton, Stack } from '@mantine/core';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import { getStoredViewMode, VIEW_MODE } from '@/shared/lib/viewMode';
import TabsSkeleton from '@/shared/ui/TabsSkeleton';
import BookmarksToolbarSkeleton from './BookmarksToolbarSkeleton';

/** Ширины названий папок — разные, чтобы полоса не выглядела штампом. */
const FOLDER_NAME_WIDTHS = [76, 100, 84, 108, 68];

/** Сторона `ActionIcon` размера по умолчанию (`sm`) — кнопки «Новая папка» и настроек. */
const ACTION_ICON_SIZE = 28;

/**
 * Загрузка /bookmarks: вкладки-папки с кнопками справа, как у `FolderTabs`, панель поиска и
 * сортировки и сетка карточек — всё скелетоном в раскладке загруженной страницы.
 */
function BookmarksSkeleton() {
  return (
    <Stack gap="md">
      <TabsSkeleton
        widths={FOLDER_NAME_WIDTHS}
        actions={Array.from({ length: 2 }, (_, index) => (
          <Skeleton h={ACTION_ICON_SIZE} w={ACTION_ICON_SIZE} key={index} />
        ))}
      />
      <BookmarksToolbarSkeleton />
      <TitleCardsGridSkeleton viewMode={getStoredViewMode() ?? VIEW_MODE.GRID} />
    </Stack>
  );
}

export default BookmarksSkeleton;

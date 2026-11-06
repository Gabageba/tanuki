import type { Title } from '@tanuki/contracts';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import type { ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';

type Props = {
  titles: Title[];
  viewMode: ViewMode;
};

/** Сетка карточек тайтлов в выбранном виде, у каждой — папка закладки, если тайтл в закладках. */
function TitleCardsGrid({ titles, viewMode }: Props) {
  const getBookmarkFolder = useTitleBookmarkFolders(titles.map(({ id }) => id));

  return (
    <ViewModeGrid viewMode={viewMode}>
      {titles.map((title) => (
        <SourceTitleCard
          key={title.id}
          title={title}
          viewMode={viewMode}
          bookmarkFolder={getBookmarkFolder(title.id)}
        />
      ))}
    </ViewModeGrid>
  );
}

export default TitleCardsGrid;

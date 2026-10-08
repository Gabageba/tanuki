import TitleCardSkeleton from '@/entities/title/card/TitleCardSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';

type Props = {
  viewMode: ViewMode;
};

const SKELETON_CARDS = 14;

/** Загрузка карточек папки — в той же сетке и том же виде, что и сами карточки. */
function BookmarksGridSkeleton({ viewMode }: Props) {
  return (
    <ViewModeGrid viewMode={viewMode}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <TitleCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </ViewModeGrid>
  );
}

export default BookmarksGridSkeleton;

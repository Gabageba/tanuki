import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import VirtualizedViewModeGrid from '@/shared/ui/VirtualizedViewModeGrid';
import SourceTitleCardSkeleton from '@/entities/source/components/SourceTitleCard/SourceTitleCardSkeleton';

/** Сколько карточек рисует скелетон: три-четыре ряда на десктопе. */
const SKELETON_CARDS = 21;
const COVERLESS_SKELETON_CARDS = 3;

type Props = {
  viewMode: ViewMode;
  skeleton?: ReactNode;
  virtualized?: boolean;
};

/** Сетка карточек-скелетонов, пока грузится первая страница списка тайтлов — каталог, подборки. */
function TitleCardsGridSkeleton({
  viewMode,
  skeleton = <SourceTitleCardSkeleton viewMode={viewMode} />,
  virtualized = false,
}: Props) {
  const getSkeletonCount = () => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
      case VIEW_MODE.LIST:
        return SKELETON_CARDS;
      case VIEW_MODE.COVERLESS:
        return COVERLESS_SKELETON_CARDS;
    }
  };
  const cards = Array.from({ length: getSkeletonCount() }, (_, index) => (
    <Fragment key={index}>{skeleton}</Fragment>
  ));

  return virtualized ? (
    <VirtualizedViewModeGrid viewMode={viewMode}>{cards}</VirtualizedViewModeGrid>
  ) : (
    <ViewModeGrid viewMode={viewMode}>{cards}</ViewModeGrid>
  );
}

export default TitleCardsGridSkeleton;

import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { type ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import SourceTitleCardSkeleton from '@/entities/source/components/SourceTitleCard/SourceTitleCardSkeleton';

/** Сколько карточек рисует скелетон: три-четыре ряда на десктопе. */
const SKELETON_CARDS = 21;

type Props = {
  viewMode: ViewMode;
  skeleton?: ReactNode;
};

/** Сетка карточек-скелетонов, пока грузится первая страница списка тайтлов — каталог, подборки. */
function TitleCardsGridSkeleton({
  viewMode,
  skeleton = <SourceTitleCardSkeleton viewMode={viewMode} />,
}: Props) {
  return (
    <ViewModeGrid viewMode={viewMode}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <Fragment key={index}>{skeleton}</Fragment>
      ))}
    </ViewModeGrid>
  );
}

export default TitleCardsGridSkeleton;

import { type ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import TitleCardSkeleton from './TitleCardSkeleton';

/** Сколько карточек рисует скелетон: три-четыре ряда на десктопе. */
const SKELETON_CARDS = 21;

type Props = {
  viewMode: ViewMode;
};

/** Сетка карточек-скелетонов, пока грузится первая страница списка тайтлов — каталог, подборки. */
function TitleCardsGridSkeleton({ viewMode }: Props) {
  return (
    <ViewModeGrid viewMode={viewMode}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <TitleCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </ViewModeGrid>
  );
}

export default TitleCardsGridSkeleton;

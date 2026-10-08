import { type ViewMode } from '@/shared/lib/viewMode';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import TitleCardSkeleton from '@/entities/title/card/TitleCardSkeleton';

type Props = {
  viewMode: ViewMode;
};

function CatalogContentGridSkeleton({ viewMode }: Props) {
  return (
    <ViewModeGrid viewMode={viewMode}>
      {Array.from({ length: 21 }).map((_, index) => (
        <TitleCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </ViewModeGrid>
  );
}

export default CatalogContentGridSkeleton;

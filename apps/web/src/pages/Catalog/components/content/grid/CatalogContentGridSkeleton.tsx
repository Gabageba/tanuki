import { type ViewMode } from '@/shared/lib/viewMode';
import CatalogContentGridWrapper from './CatalogContentGridWrapper';
import TitleCardSkeleton from '@/entities/title/card/TitleCardSkeleton';

type Props = {
  viewMode: ViewMode;
};

function CatalogContentGridSkeleton({ viewMode }: Props) {
  return (
    <CatalogContentGridWrapper viewMode={viewMode}>
      {Array.from({ length: 21 }).map((_, index) => (
        <TitleCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </CatalogContentGridWrapper>
  );
}

export default CatalogContentGridSkeleton;

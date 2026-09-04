import { type ViewMode } from '@/shared/lib/viewMode';
import CatalogContentGridWrapper from './CatalogContentGridWrapper';
import MangaCardSkeleton from '@/entities/manga/card/MangaCardSkeleton';

type Props = {
  viewMode: ViewMode;
};

function CatalogContentGridSkeleton({ viewMode }: Props) {
  return (
    <CatalogContentGridWrapper viewMode={viewMode}>
      {Array.from({ length: 21 }).map((_, index) => (
        <MangaCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </CatalogContentGridWrapper>
  );
}

export default CatalogContentGridSkeleton;

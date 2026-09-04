import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams, CatalogQuery } from '../../../models';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import CatalogContentGridSkeleton from './CatalogContentGridSkeleton';
import MangaCard from '@/entities/manga/card/MangaCard';
import CatalogContentGridWrapper from './CatalogContentGridWrapper';

function CatalogContentGrid() {
  const { data, isFetching, isFetchingNextPage } = PageLayout.useQuery<CatalogQuery>();
  const { params } = PageLayout.useParams<CatalogParams>();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const viewMode = params.viewMode ?? VIEW_MODE.GRID;

  if (isFetching && !isFetchingNextPage) {
    return <CatalogContentGridSkeleton viewMode={viewMode} />;
  }

  return (
    <>
      <CatalogContentGridWrapper viewMode={viewMode}>
        {items.map((manga) => (
          <MangaCard key={manga.id} manga={manga} viewMode={viewMode} />
        ))}
      </CatalogContentGridWrapper>
      <PageLayout.InfiniteScrollTrigger />
    </>
  );
}

export default CatalogContentGrid;

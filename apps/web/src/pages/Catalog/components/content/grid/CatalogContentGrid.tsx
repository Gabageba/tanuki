import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams, CatalogQuery } from '../../../models';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import TitleCard from '@/entities/title/card/TitleCard';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';

function CatalogContentGrid() {
  const { data, isFetching, isFetchingNextPage } = PageLayout.useQuery<CatalogQuery>();
  const { params } = PageLayout.useParams<CatalogParams>();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const viewMode = params.viewMode ?? VIEW_MODE.GRID;
  const getBookmarkFolder = useTitleBookmarkFolders(items.map(({ id }) => id));

  if (isFetching && !isFetchingNextPage) {
    return <TitleCardsGridSkeleton viewMode={viewMode} />;
  }

  return (
    <>
      <ViewModeGrid viewMode={viewMode}>
        {items.map((title) => (
          <TitleCard
            key={title.id}
            title={title}
            viewMode={viewMode}
            bookmarkFolder={getBookmarkFolder(title.id)}
          />
        ))}
      </ViewModeGrid>
      <PageLayout.InfiniteScrollTrigger />
    </>
  );
}

export default CatalogContentGrid;

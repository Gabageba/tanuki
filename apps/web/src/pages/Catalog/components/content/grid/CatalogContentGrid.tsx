import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import type { CatalogParams, CatalogQuery } from '../../../models';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import TitleCardsGrid from '@/entities/title/card/TitleCardsGrid';
import CatalogEmpty from './CatalogEmpty';

type Props = {
  sourceId: string | undefined;
};

function CatalogContentGrid({ sourceId }: Props) {
  const query = PageLayout.useQuery<CatalogQuery>();
  const { params } = PageLayout.useParams<CatalogParams>();
  const viewMode = params.viewMode ?? VIEW_MODE.GRID;

  // Пока запрос выключен в ожидании источника, данных нет — это тоже скелетон, не пустое состояние.
  return (
    <QueryBlock
      query={query}
      skeleton={<TitleCardsGridSkeleton viewMode={viewMode} />}
      empty={<CatalogEmpty sourceId={sourceId} />}
      isEmpty={({ pages }) => pages.every(({ items }) => items.length === 0)}
    >
      {({ pages }) => (
        <>
          <TitleCardsGrid titles={pages.flatMap(({ items }) => items)} viewMode={viewMode} />
          <PageLayout.InfiniteScrollTrigger />
        </>
      )}
    </QueryBlock>
  );
}

export default CatalogContentGrid;

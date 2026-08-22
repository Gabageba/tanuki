import usePageLayoutQuery from '@/shared/ui/PageLayout/hooks/usePageLayoutQuery';
import RefreshCatalogButton from './RefreshCatalogButton';
import type { CatalogQuery } from './models';

type Props = {
  sourceId: string;
};

function CatalogRefreshButton({ sourceId }: Props) {
  const { isFetching, isFetchingNextPage, refresh } = usePageLayoutQuery<CatalogQuery>();

  return (
    <RefreshCatalogButton
      sourceId={sourceId}
      isRefreshing={isFetching && !isFetchingNextPage}
      onRefresh={refresh}
    />
  );
}

export default CatalogRefreshButton;

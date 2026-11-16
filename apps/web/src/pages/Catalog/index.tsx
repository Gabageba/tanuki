import { useParams } from 'react-router';
import useCatalog from './hooks/useCatalog';
import useCatalogParams from './hooks/useCatalogParams';
import PageLayout from '@/shared/ui/PageLayout';
import CatalogHeader from './components/header/CatalogHeader';
import useSource from '@/entities/source/hooks/useSource';
import CatalogContent from './components/content/CatalogContent';
import { isTitleSearchLocked } from '@/entities/source/lib';

function Catalog() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const sourceQuery = useSource({ sourceId });
  const source = sourceQuery.data;
  const isSearchLocked = isTitleSearchLocked(sourceId ?? '', source);
  const { params, setParams } = useCatalogParams(sourceId ?? '', isSearchLocked);

  return (
    <PageLayout
      key={`${sourceId}:${isSearchLocked}`}
      useQuery={useCatalog}
      params={params}
      onParamsChange={setParams}
    >
      <CatalogHeader sourceQuery={sourceQuery} />
      <PageLayout.PullToRefresh />
      <CatalogContent sourceId={sourceId} />
    </PageLayout>
  );
}

export default Catalog;

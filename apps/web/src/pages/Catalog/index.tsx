import { useParams, useSearchParams } from 'react-router';
import useCatalog from './hooks/useCatalog';
import PageLayout from '@/shared/ui/PageLayout';
import CatalogHeader from './components/header/CatalogHeader';
import useSource from '@/entities/source/hooks/useSource';
import CatalogContent from './components/content/CatalogContent';
import { parseFilters } from './utils/filterSelection';
import { parseSortDirection, parseSortOrder } from './utils/sortOrder';
import { getStoredViewMode } from '@/shared/lib/viewMode';

function Catalog() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const { data: source, isPending: isSourcePending } = useSource({ sourceId });
  const [searchParams] = useSearchParams();

  return (
    <PageLayout
      key={sourceId}
      useQuery={useCatalog}
      params={{
        sourceId: sourceId ?? '',
        order: parseSortOrder(searchParams.get('order')),
        direction: parseSortDirection(searchParams.get('direction')),
        filters: parseFilters(searchParams.getAll('filters')),
        viewMode: getStoredViewMode(),
      }}
    >
      <CatalogHeader source={source} isPending={isSourcePending} />
      <PageLayout.ErrorNotification
        title="Не удалось загрузить каталог"
        fallbackMessage="Источник недоступен. Попробуйте позже."
      />
      <PageLayout.PullToRefresh />
      <CatalogContent sourceId={sourceId} />
    </PageLayout>
  );
}

export default Catalog;

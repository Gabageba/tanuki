import { useParams, useSearchParams } from 'react-router';
import useCatalog from './hooks/useCatalog';
import PageLayout from '@/shared/ui/PageLayout';
import CatalogHeader from './components/header/CatalogHeader';
import useSource from '@/entities/source/hooks/useSource';
import CatalogContent from './components/content/CatalogContent';
import { parseFilters } from '@/features/filters/lib/filterSelection';
import { parseSortDirection, parseSortOrder } from './utils/sortOrder';
import { getStoredViewMode } from '@/shared/lib/viewMode';
import { isTitleSearchLocked } from '@/entities/source/lib';

function Catalog() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const sourceQuery = useSource({ sourceId });
  const source = sourceQuery.data;
  const [searchParams] = useSearchParams();
  // Закрытый поиск не отправляет query из адреса (закладка, старая ссылка): каталог открывается
  // без него. Параметры PageLayout берёт при монтировании, поэтому смена блокировки — новый key.
  const isSearchLocked = isTitleSearchLocked(sourceId ?? '', source);

  return (
    <PageLayout
      key={`${sourceId}:${isSearchLocked}`}
      useQuery={useCatalog}
      params={{
        sourceId: sourceId ?? '',
        // С /search «Все результаты» приходят сюда с тем же запросом.
        query: isSearchLocked ? undefined : (searchParams.get('query') ?? undefined),
        order: parseSortOrder(searchParams.get('order')),
        direction: parseSortDirection(searchParams.get('direction')),
        filters: parseFilters(searchParams.getAll('filters')),
        viewMode: getStoredViewMode(),
      }}
    >
      <CatalogHeader sourceQuery={sourceQuery} />
      <PageLayout.PullToRefresh />
      <CatalogContent sourceId={sourceId} />
    </PageLayout>
  );
}

export default Catalog;

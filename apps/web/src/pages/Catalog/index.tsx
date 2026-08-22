import { useParams } from 'react-router';
import { useState } from 'react';
import useCatalog from './hooks/useCatalog';
import CatalogGrid from './CatalogGrid';
import PageLayout from '@/shared/ui/PageLayout';
import CatalogHeader from './components/header/CatalogHeader';

function Catalog() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [query, setQuery] = useState('');

  return (
    <PageLayout useQuery={useCatalog} params={[{ sourceId: sourceId ?? '', query }]}>
      <PageLayout.Header>
        <CatalogHeader sourceId={sourceId} handleSearch={setQuery} />
      </PageLayout.Header>
      <PageLayout.ErrorNotification
        title="Не удалось загрузить каталог"
        fallbackMessage="Источник недоступен. Попробуйте позже."
      />
      <PageLayout.PullToRefresh />

      <PageLayout.Content>
        <CatalogGrid />
        <PageLayout.InfiniteScrollTrigger />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Catalog;

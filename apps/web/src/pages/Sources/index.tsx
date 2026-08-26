import useSources from '@/entities/source/hooks/useSources';
import PageLayout from '@/shared/ui/PageLayout';
import SourcesList from './SourcesList';

function Sources() {
  return (
    <PageLayout useQuery={useSources}>
      <PageLayout.Content title="Источники">
        <SourcesList />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Sources;

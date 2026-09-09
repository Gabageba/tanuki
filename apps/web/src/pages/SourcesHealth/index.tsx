import PageLayout from '@/shared/ui/PageLayout';
import useSourcesHealth from './hooks/useSourcesHealth';
import ProbeAllButton from './ProbeAllButton';
import SourcesHealthTable from './SourcesHealthTable';

function SourcesHealth() {
  return (
    <PageLayout useQuery={useSourcesHealth}>
      <PageLayout.Content title="Здоровье источников" actions={<ProbeAllButton />}>
        <SourcesHealthTable />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default SourcesHealth;

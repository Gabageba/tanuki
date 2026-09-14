import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import useSourcesHealth from './hooks/useSourcesHealth';
import ProbeAllButton from './ProbeAllButton';
import SourcesHealthTable from './SourcesHealthTable';
import { ROUTE_PATHS } from '@/shared/consts/routes';

function SourcesHealth() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useSourcesHealth}>
      <PageLayout.Content
        title={t('sourcesHealth')}
        actions={<ProbeAllButton />}
        goBack={{ path: ROUTE_PATHS.SOURCES }}
      >
        <SourcesHealthTable />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default SourcesHealth;

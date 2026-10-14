import { Button } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AsclepiusIcon } from '@phosphor-icons/react';
import useSources from '@/entities/source/hooks/useSources';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SourcesList from './SourcesList';

function Sources() {
  const { t } = useTranslation();

  return (
    <PageLayout useQuery={useSources}>
      <PageLayout.Content
        title={t('sources')}
        goBack={{ path: ROUTE_PATHS.HOME }}
        showLoading={false}
        actions={
          <Button
            component={Link}
            to={ROUTE_PATHS.SOURCES_HEALTH}
            variant="default"
            leftSection={<AsclepiusIcon />}
          >
            {t('sourcesHealth')}
          </Button>
        }
      >
        <SourcesList />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Sources;

import { Button } from '@mantine/core';
import { Link } from 'react-router';
import useSources from '@/entities/source/hooks/useSources';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import SourcesList from './SourcesList';

function Sources() {
  return (
    <PageLayout useQuery={useSources}>
      <PageLayout.Content
        title="Источники"
        actions={
          <Button component={Link} to={ROUTE_PATHS.SOURCES_HEALTH} variant="default">
            Здоровье источников
          </Button>
        }
      >
        <SourcesList />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Sources;

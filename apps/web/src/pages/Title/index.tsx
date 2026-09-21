import { useParams } from 'react-router';
import { Divider, Grid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import TitleImageSection from './components/TitleImageSection';
import TitleDetailsSection from './components/TitleDetailsSection';

function Title() {
  const { t } = useTranslation();
  const { titleId = '' } = useParams<{ titleId: string }>();

  return (
    <PageLayout key={titleId} useQuery={useTitleDetails} params={{ titleId }}>
      <PageLayout.Content showLoading={false}>
        <Grid columnGap="lg">
          <TitleImageSection />
          <Divider orientation="vertical" visibleFrom="md" />
          <TitleDetailsSection />
        </Grid>
      </PageLayout.Content>
      <PageLayout.ErrorNotification
        title={t('failedToLoadTitle')}
        fallbackMessage={t('sourceUnavailableTryLater')}
      />
    </PageLayout>
  );
}

export default Title;

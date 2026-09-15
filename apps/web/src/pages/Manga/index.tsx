import { useParams } from 'react-router';
import { Divider, Grid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import useMangaDetails from './hooks/useMangaDetails';
import MangaImageSection from './components/MangaImageSection';
import MangaDetailsSection from './components/MangaDetailsSection';

function Manga() {
  const { t } = useTranslation();
  const { mangaId = '' } = useParams<{ mangaId: string }>();

  return (
    <PageLayout key={mangaId} useQuery={useMangaDetails} params={{ mangaId }}>
      <PageLayout.Content showLoading={false}>
        <Grid columnGap="lg">
          <MangaImageSection />
          <Divider orientation="vertical" visibleFrom="md" />
          <MangaDetailsSection />
        </Grid>
      </PageLayout.Content>
      <PageLayout.ErrorNotification
        title={t('failedToLoadManga')}
        fallbackMessage={t('sourceUnavailableTryLater')}
      />
    </PageLayout>
  );
}

export default Manga;

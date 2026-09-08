import { useParams } from 'react-router';
import { Divider, Grid } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import useMangaDetails from './hooks/useMangaDetails';
import MangaImageSection from './components/MangaImageSection';
import MangaDetailsSection from './components/MangaDetailsSection';

function Manga() {
  const { sourceId = '', mangaId = '' } = useParams<{ sourceId: string; mangaId: string }>();

  return (
    <PageLayout useQuery={useMangaDetails} params={{ sourceId, mangaId }}>
      <PageLayout.Content>
        <Grid columnGap="lg">
          <MangaImageSection />
          <Divider orientation="vertical" />
          <MangaDetailsSection />
        </Grid>
      </PageLayout.Content>
      <PageLayout.ErrorNotification
        title="Не удалось загрузить мангу"
        fallbackMessage="Источник недоступен. Попробуйте позже."
      />
    </PageLayout>
  );
}

export default Manga;

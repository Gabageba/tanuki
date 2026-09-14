import { useParams } from 'react-router';
import { Divider, Grid } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import useMangaDetails from './hooks/useMangaDetails';
import MangaImageSection from './components/MangaImageSection';
import MangaDetailsSection from './components/MangaDetailsSection';
import MangaImageSectionSkeleton from './components/MangaImageSection/MangaImageSectionSkeleton';
import MangaDetailsSectionSkeleton from './components/MangaDetailsSection/MangaDetailsSectionSkeleton';

function Manga() {
  const { mangaId = '' } = useParams<{ mangaId: string }>();

  return (
    <PageLayout key={mangaId} useQuery={useMangaDetails} params={{ mangaId }}>
      <PageLayout.Content showLoading={false}>
        <Grid columnGap="lg">
          <MangaImageSection />
          <Divider orientation="vertical" />
          <MangaDetailsSection />
        </Grid>
        <Grid columnGap="lg">
          <MangaImageSectionSkeleton />
          <Divider orientation="vertical" />
          <MangaDetailsSectionSkeleton />
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

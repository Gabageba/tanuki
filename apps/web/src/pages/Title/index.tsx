import { useParams } from 'react-router';
import { Divider, Grid } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import useReadingProgress from '@/entities/title/hooks/useReadingProgress';
import TitleImageSection from './components/TitleImageSection';
import TitleDetailsSection from './components/TitleDetailsSection';
import TitleBookmarkConflict from './components/TitleBookmarkConflict';
import useTitleBookmarkVisit from './hooks/useTitleBookmarkVisit';

function Title() {
  const { titleId = '' } = useParams<{ titleId: string }>();
  // Кнопка чтения появляется только после деталей тайтла, и запрос отметки из неё встал бы за ними
  // в очередь. Отсюда он идёт параллельно, а кнопка берёт готовое из кеша.
  useReadingProgress({ titleId });
  // Визит — сразу при открытии: он же отдаёт новые главы для списка глав.
  useTitleBookmarkVisit(titleId);

  return (
    <PageLayout key={titleId} useQuery={useTitleDetails} params={{ titleId }}>
      <PageLayout.Content showLoading={false}>
        <Grid columnGap="lg">
          <TitleImageSection />
          <Divider orientation="vertical" visibleFrom="md" />
          <TitleDetailsSection />
        </Grid>
        <TitleBookmarkConflict titleId={titleId} />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Title;

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Divider, Grid } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import PageLayout from '@/shared/ui/PageLayout';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import useReadingProgress, {
  getReadingProgressQueryKey,
} from '@/entities/title/hooks/useReadingProgress';
import { BOOKMARK_FOLDERS_QUERY_KEY, getTitleBookmarkQueryKey } from '@/entities/bookmark/models';
import TitleImageSection from './components/TitleImageSection';
import TitleDetailsSection from './components/TitleDetailsSection';
import TitleBookmarkConflict from './components/TitleBookmarkConflict';
import TitleSkeleton from './components/TitleSkeleton';
import useTitleBookmarkVisit from './hooks/useTitleBookmarkVisit';
import type { TitlePageParams } from './models';

function Title() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { titleId = '' } = useParams<{ titleId: string }>();
  // Кнопка чтения появляется только после деталей тайтла, и запрос отметки из неё встал бы за ними
  // в очередь. Отсюда он идёт параллельно, а кнопка берёт готовое из кеша.
  useReadingProgress({ titleId });
  // Визит — сразу при открытии: он же отдаёт новые главы для списка глав.
  useTitleBookmarkVisit(titleId);
  const params: TitlePageParams = { titleId, branchId: null };

  // Визит не обновляем: повторный POST погасил бы точки новых глав на открытой странице.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['title', titleId] }),
      queryClient.invalidateQueries({ queryKey: ['chapters', titleId] }),
      queryClient.invalidateQueries({ queryKey: getReadingProgressQueryKey(titleId) }),
      queryClient.invalidateQueries({ queryKey: getTitleBookmarkQueryKey(titleId) }),
      queryClient.invalidateQueries({ queryKey: BOOKMARK_FOLDERS_QUERY_KEY }),
    ]);

  return (
    <PageLayout key={titleId} useQuery={useTitleDetails} params={params}>
      <PageLayout.PullToRefresh onRefresh={refresh} />
      <PageLayout.Content
        skeleton={<TitleSkeleton />}
        offlineDescription={t('titleNotSavedOnDevice')}
      >
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

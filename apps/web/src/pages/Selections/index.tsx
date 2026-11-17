import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';
import { SELECTIONS_QUERY_KEY } from '@/features/selections/models';
import SelectionsContent from './components/SelectionsContent';
import SelectionsSkeleton from './components/SelectionsSkeleton';
import useSelectionsQueries from './hooks/useSelectionsQueries';

/** Подборки (R1) — блоки с главных страниц сайтов: источник селектором, блоки вкладками. */
function Selections() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: SELECTIONS_QUERY_KEY }),
    ]);

  return (
    <PageLayout useQueries={useSelectionsQueries} requireAll>
      <PageLayout.PullToRefresh onRefresh={refresh} />
      <PageLayout.Content
        title={t('selections')}
        goBack={{ path: ROUTE_PATHS.HOME }}
        skeleton={<SelectionsSkeleton />}
      >
        <SelectionsContent />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Selections;

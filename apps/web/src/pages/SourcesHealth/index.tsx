import { useTranslation } from 'react-i18next';
import { isStaffRole } from '@tanuki/contracts';
import PageLayout from '@/shared/ui/PageLayout';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useSourcesHealth from './hooks/useSourcesHealth';
import ProbeAllButton from './ProbeAllButton';
import SourcesHealthTable from './SourcesHealthTable';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** Страница видна всем вошедшим, а проверять источники может только персонал. Загрузку
 *  показывает скелетон таблицы, а не общий `Loader`. */
function SourcesHealth() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const isStaff = isStaffRole(currentUser?.role);

  return (
    <PageLayout useQuery={useSourcesHealth}>
      <PageLayout.Content
        title={t('sourcesHealth')}
        actions={isStaff && <ProbeAllButton />}
        goBack={{ path: ROUTE_PATHS.SOURCES }}
        showLoading={false}
      >
        <SourcesHealthTable isStaff={isStaff} />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default SourcesHealth;

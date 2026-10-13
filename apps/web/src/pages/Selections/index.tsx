import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SelectionsContent from './components/SelectionsContent';

/** Подборки (P3a + K1 + L4 + Z1) — блоки с главных страниц сайтов, один источник за раз. */
function Selections() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <PageLayout.Content title={t('selections')} goBack={{ path: ROUTE_PATHS.HOME }}>
        <SelectionsContent />
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Selections;

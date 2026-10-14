import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SelectionsContent from './components/SelectionsContent';

/** Подборки (R1) — блоки с главных страниц сайтов: источник селектором, блоки вкладками. */
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

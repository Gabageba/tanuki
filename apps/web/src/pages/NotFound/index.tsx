import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { HouseIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import PageLayout from '@/shared/ui/PageLayout';
import StatusScreen from '@/shared/ui/StatusScreen';

/** «Не найдено» — для несуществующего адреса. */
function NotFound() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <PageLayout.Content>
        <StatusScreen
          code="404"
          title={t('pageNotFound')}
          description={t('maybeDeletedOrWrongLink')}
        >
          <Button component={Link} to={ROUTE_PATHS.HOME} leftSection={<HouseIcon />}>
            {t('toMainPage')}
          </Button>
        </StatusScreen>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default NotFound;

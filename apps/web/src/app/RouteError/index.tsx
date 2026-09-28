import { useEffect } from 'react';
import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';
import PageLayout from '@/shared/ui/PageLayout';
import StatusScreen from '@/shared/ui/StatusScreen';

/** errorElement корня роутера: упавший рендер вместо дефолтного экрана react-router. */
function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageLayout>
      <PageLayout.Content>
        <StatusScreen
          code="500"
          title={t('somethingWentWrong')}
          description={t('pageCrashedTryReloading')}
        >
          <Button size="md" onClick={() => window.location.reload()}>
            {t('reloadPage')}
          </Button>
        </StatusScreen>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default RouteError;

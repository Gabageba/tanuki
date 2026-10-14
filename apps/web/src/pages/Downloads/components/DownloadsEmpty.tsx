import { Button, EmptyState } from '@mantine/core';
import { CompassIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** На «Загрузках» ничего нет — ни очереди, ни скачанного (E2): описание учит, как скачать. */
function DownloadsEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('nothingDownloaded')}
      description={t('pressArrowOrDownloadAll')}
      icon={<DownloadSimpleIcon />}
    >
      <EmptyState.Actions>
        <Button
          component={Link}
          to={ROUTE_PATHS.SOURCES}
          variant="default"
          leftSection={<CompassIcon />}
        >
          {t('openCatalog')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default DownloadsEmpty;

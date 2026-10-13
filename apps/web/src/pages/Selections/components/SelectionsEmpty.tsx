import { Button, EmptyState } from '@mantine/core';
import { Link } from 'react-router';
import { GearIcon, SparkleIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS, SETTINGS_SELECTIONS_PATH } from '@/shared/lib/routes';

/** E2 — все источники выключены в подборках: в настройки или во все источники. */
function SelectionsEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<SparkleIcon />}
      title={t('noSelections')}
      description={t('allSourcesDisabledInSelectionsSettings')}
    >
      <EmptyState.Actions>
        <Button
          component={Link}
          to={SETTINGS_SELECTIONS_PATH}
          variant="default"
          leftSection={<GearIcon />}
        >
          {t('setUpSelections')}
        </Button>
        <Button
          component={Link}
          to={ROUTE_PATHS.SOURCES}
          variant="default"
          leftSection={<SquaresFourIcon />}
        >
          {t('allSources')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SelectionsEmpty;

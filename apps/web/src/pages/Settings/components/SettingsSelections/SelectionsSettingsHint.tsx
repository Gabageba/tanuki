import { Anchor, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { SETTINGS_SOURCES_PATH } from '@/shared/lib/routes';

const LINK = { link: <Anchor component={Link} to={SETTINGS_SOURCES_PATH} inherit /> };

/** Пояснение над списком: что такое подборки и где меняется порядок источников. */
function SelectionsSettingsHint() {
  const { t } = useTranslation();

  return (
    <Stack gap={4}>
      <Text c="dimmed">{t('selectionsAreBlocksFromSiteHomePages')}</Text>
      <Text c="dimmed">
        <Trans i18nKey="sourceOrderIsSharedChangeInSourcesTab" components={LINK} />
      </Text>
    </Stack>
  );
}

export default SelectionsSettingsHint;

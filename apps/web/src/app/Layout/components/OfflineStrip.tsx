import { Anchor, Group, Text } from '@mantine/core';
import { useNetwork } from '@mantine/hooks';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getMutedBackground, STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** «Нет сети» (N2b): бледная золотая полоса во всю ширину под шапкой и ссылка в «Загрузки». Фраза —
 *  обычным цветом текста: золотой текст читался грязной полосой. */
function OfflineStrip() {
  const { t } = useTranslation();
  const { online } = useNetwork();

  if (online) return null;

  return (
    <Group gap="xs" px="md" py={6} wrap="nowrap" bg={getMutedBackground(STATUS_DEGRADED_COLOR)}>
      <CloudSlashIcon
        size={16}
        color={`var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`}
        style={{ flex: 'none' }}
      />
      <Text fz="sm" flex={1} truncate="end">
        {t('noNetworkDownloadsAvailable')}
      </Text>
      <Anchor
        component={Link}
        to={ROUTE_PATHS.DOWNLOADS}
        fz="sm"
        fw={600}
        flex="none"
        c={`var(--mantine-color-${STATUS_DEGRADED_COLOR}-text)`}
      >
        <Group gap={4} wrap="nowrap" component="span">
          <TrayArrowDownIcon size={16} />
          {t('downloads')}
        </Group>
      </Anchor>
    </Group>
  );
}

export default OfflineStrip;

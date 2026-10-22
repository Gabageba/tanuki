import { Anchor, Group, Text } from '@mantine/core';
import { useNetwork } from '@mantine/hooks';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getMutedBackground, PRIMARY_COLOR } from '@/shared/lib/palette';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** «Нет сети» (N2b): бледная полоса основного цвета во всю ширину под шапкой и ссылка в «Загрузки».
 *  Фраза — обычным цветом текста, акцентом — только значок и ссылка. */
function OfflineStrip() {
  const { t } = useTranslation();
  const { online } = useNetwork();

  if (online) return null;

  return (
    <Group gap="xs" px="md" py={6} wrap="nowrap" bg={getMutedBackground(PRIMARY_COLOR)}>
      <CloudSlashIcon
        size={16}
        color="var(--mantine-primary-color-filled)"
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
        c={`var(--mantine-color-${PRIMARY_COLOR}-text)`}
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

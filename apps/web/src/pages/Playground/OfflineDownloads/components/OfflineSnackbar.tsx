import { use } from 'react';
import { Anchor, Group, Paper, Text } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';

/** N12 — постоянная плашка внизу, пока нет сети: на десктопе в левом нижнем углу, на телефоне —
 *  над нижней панелью во всю ширину. Шапка не меняется. */
function OfflineSnackbar() {
  const isPhone = use(PHONE_FRAME_CONTEXT);

  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      px="md"
      py="xs"
      pos="absolute"
      bottom={12}
      left={12}
      right={isPhone ? 12 : undefined}
    >
      <Group gap="sm" wrap="nowrap">
        <CloudSlashIcon
          size={18}
          color={`var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`}
          style={{ flex: 'none' }}
        />
        <Text fz="sm" flex={1}>
          Нет сети
        </Text>
        <Anchor component={Link} to="#" fz="sm" fw={600}>
          Загрузки
        </Anchor>
      </Group>
    </Paper>
  );
}

export default OfflineSnackbar;

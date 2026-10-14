import { Anchor, Group, Paper, Text } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import MidDot from '@/shared/ui/MidDot';
import styles from '../OfflineDownloads.module.scss';

/** N7 — капсула «Нет сети · Загрузки» по центру под шапкой, поверх страницы. */
function OfflineCapsule() {
  return (
    <Paper withBorder shadow="md" radius="xl" px="md" py={4} className={styles.capsule}>
      <Group gap={6} wrap="nowrap">
        <CloudSlashIcon size={14} color={`var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`} />
        <Text fz="sm" style={{ whiteSpace: 'nowrap' }}>
          Нет сети
        </Text>
        <MidDot c="dimmed" fz="sm" />
        <Anchor component={Link} to="#" fz="sm" fw={600}>
          Загрузки
        </Anchor>
      </Group>
    </Paper>
  );
}

export default OfflineCapsule;

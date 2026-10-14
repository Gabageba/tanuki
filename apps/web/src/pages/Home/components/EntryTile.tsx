import type { ReactNode } from 'react';
import { Box, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowLineRightIcon } from '@phosphor-icons/react';
import styles from './EntryTile.module.scss';

type Props = {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  /** Картинка справа: веер обложек у подборок, ряд логотипов у источников. */
  visual: ReactNode;
};

/** Плитка-вход главной (V2a): иконка, название со стрелкой, что внутри, и картинка справа. */
function EntryTile({ to, icon, title, description, visual }: Props) {
  return (
    <Paper
      component={Link}
      to={to}
      withBorder
      radius="lg"
      p="md"
      c="inherit"
      td="none"
      className={styles.tile}
    >
      <Group justify="space-between" wrap="nowrap" gap="md">
        <Stack gap="xs" miw={0}>
          <ThemeIcon variant="light" size={40} radius="md">
            {icon}
          </ThemeIcon>
          <Group gap={6} wrap="nowrap">
            <ArrowLineRightIcon weight="bold" className={styles.arrow} />
            <Text fw={600}>{title}</Text>
          </Group>
          <Text fz="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        <Box flex="none" className={styles.visual}>
          {visual}
        </Box>
      </Group>
    </Paper>
  );
}

export default EntryTile;

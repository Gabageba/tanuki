import type { ReactNode } from 'react';
import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowLineRightIcon } from '@phosphor-icons/react';

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
    <Paper component={Link} to={to} withBorder radius="lg" p="md" c="inherit" td="none">
      <Group justify="space-between" wrap="nowrap" gap="md">
        <Stack gap="xs" miw={0}>
          <ThemeIcon variant="light" size={40} radius="md">
            {icon}
          </ThemeIcon>
          <Group gap={6} wrap="nowrap">
            <ArrowLineRightIcon weight="bold" />
            <Text fw={600}>{title}</Text>
          </Group>
          <Text fz="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        {visual}
      </Group>
    </Paper>
  );
}

export default EntryTile;

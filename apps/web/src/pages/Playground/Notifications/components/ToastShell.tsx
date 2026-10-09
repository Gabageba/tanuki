import type { ReactNode } from 'react';
import { ActionIcon, Box, Group, Paper, ThemeIcon } from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import styles from '../Notifications.module.scss';

type Props = {
  icon: ReactNode;
  color: string;
  children: ReactNode;
  /** Весь тост кликабелен. */
  isClickable?: boolean;
};

/** Оболочка тоста: тонированная иконка, содержимое, «×». */
function ToastShell({ icon, color, children, isClickable = false }: Props) {
  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      p="sm"
      w={360}
      maw="100%"
      className={isClickable ? styles.toastClickable : undefined}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <ThemeIcon variant="muted" color={color} size={32} radius="md" flex="none">
          {icon}
        </ThemeIcon>
        <Box flex={1} miw={0}>
          {children}
        </Box>
        <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Закрыть" flex="none">
          <XIcon size={14} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}

export default ToastShell;

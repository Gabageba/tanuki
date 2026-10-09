import type { ReactNode } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import PhoneFrame from './PhoneFrame';
import styles from '../Notifications.module.scss';

type Props = {
  children: ReactNode;
  /** Показать только десктоп. */
  desktopOnly?: boolean;
};

/** Вариант в ширине десктопа и в рамке телефона. */
function Frames({ children, desktopOnly = false }: Props) {
  return (
    <Stack gap="md">
      <Stack gap={6} maw={900}>
        <Text fz={12} c="dimmed" ff="monospace">
          Десктоп
        </Text>
        <Box p="md" className={styles.frame} bg="var(--mantine-color-body)">
          {children}
        </Box>
      </Stack>
      {!desktopOnly && <PhoneFrame>{children}</PhoneFrame>}
    </Stack>
  );
}

export default Frames;

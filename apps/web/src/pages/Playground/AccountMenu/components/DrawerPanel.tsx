import type { ReactNode } from 'react';
import { Box, CloseButton, Group, Paper, Text } from '@mantine/core';

type Props = {
  /** Строка — как сейчас, текстом 16/600; узел — карточка или шаблон заголовка. */
  title: ReactNode;
  isFlush?: boolean;
  children: ReactNode;
};

/** Drawer без экрана вокруг: шапка с теми же полями и фоном, что у темы, и начало содержимого. */
function DrawerPanel({ title, isFlush = false, children }: Props) {
  return (
    <Paper withBorder radius="md" w={375} maw="100%" style={{ overflow: 'hidden' }}>
      <Group
        p="md"
        pr={11}
        gap="sm"
        wrap="nowrap"
        justify="space-between"
        bg="var(--tanuki-color-surface)"
      >
        {typeof title === 'string' ? (
          <Text fw={600} fz="md" lh={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        <CloseButton />
      </Group>
      <Box px={isFlush ? 4 : 'md'} pb="md">
        {children}
      </Box>
    </Paper>
  );
}

export default DrawerPanel;

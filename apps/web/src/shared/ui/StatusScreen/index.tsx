import type { ReactNode } from 'react';
import { Box, Center, Group, Stack, Text, Title } from '@mantine/core';
import classes from './StatusScreen.module.scss';

type Props = {
  code: string;
  title: ReactNode;
  description: ReactNode;
  /** Кнопки под описанием. */
  children: ReactNode;
};

/** Полноэкранное состояние «что-то не так» с кодом ошибки фоном — 403, упавший рендер и т.п.
 *  Рисуется внутри PageLayout.Content. */
function StatusScreen({ code, title, description, children }: Props) {
  return (
    <Center className={classes.root} py="xl">
      <Stack w="100%" align="center" gap="sm">
        <Box className={classes.overlay} w="100%">
          <Text
            component="div"
            className={classes.code}
            aria-hidden
            ff="monospace"
            fz="var(--status-code-size)"
            fw={800}
            lh={0.8}
            ta="center"
          >
            {code}
          </Text>
          <Stack align="center" justify="flex-end" gap={8}>
            <Title ta="center" fz={{ base: 32, sm: 38 }} lh="tight">
              {title}
            </Title>
            <Text c="dimmed" size="lg" ta="center" maw={540} fz={{ base: 14, sm: 16 }}>
              {description}
            </Text>
          </Stack>
        </Box>
        <Group justify="center">{children}</Group>
      </Stack>
    </Center>
  );
}

export default StatusScreen;

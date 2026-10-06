import type { ReactNode } from 'react';
import { Box, CloseButton, Group, Overlay, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import MobileFooter from './MobileFooter';
import {
  SHEET_HEIGHT,
  SHEET_POSITION,
  type MenuTrigger,
  type MockUser,
  type SheetHeight,
  type SheetPosition,
} from '../models';

type Props = {
  user: MockUser;
  trigger: MenuTrigger;
  position: SheetPosition;
  height?: SheetHeight;
  /** Заголовок: строка или карточка. У sheet снизу без заголовка — только ручка. */
  title?: ReactNode;
  /** Тело с полем 4px, как у выпадающего меню, — строки сами держат отступ 12px. */
  isFlush?: boolean;
  children: ReactNode;
};

/** Экран телефона 375px с открытым drawer. Нижняя панель, как в приложении, лежит поверх него. */
function PhoneFrame({
  user,
  trigger,
  position,
  height = SHEET_HEIGHT.AUTO,
  title,
  isFlush = false,
  children,
}: Props) {
  const isBottom = position === SHEET_POSITION.BOTTOM;

  return (
    <Paper withBorder radius="lg" w={375} h={667} pos="relative" style={{ overflow: 'hidden' }}>
      <Stack gap="md" p="md">
        <Skeleton animate={false} h={24} w={120} />
        <Skeleton animate={false} h={160} radius="md" />
        <Skeleton animate={false} h={14} w="80%" />
        <Skeleton animate={false} h={14} w="60%" />
        <Skeleton animate={false} h={160} radius="md" />
      </Stack>
      <Overlay zIndex={0} />
      <Paper
        pos="absolute"
        left={0}
        right={0}
        top={isBottom && height === SHEET_HEIGHT.AUTO ? undefined : isBottom ? 48 : 0}
        bottom={isBottom ? HEADER_HEIGHT : 0}
        radius={0}
        display="flex"
        style={{
          flexDirection: 'column',
          overflow: 'hidden',
          borderTopLeftRadius: isBottom ? 'var(--mantine-radius-lg)' : undefined,
          borderTopRightRadius: isBottom ? 'var(--mantine-radius-lg)' : undefined,
        }}
      >
        {isBottom && (
          <Box w={36} h={4} mx="auto" mt="xs" bdrs="xl" bg="var(--mantine-color-default-border)" />
        )}
        {title !== undefined ? (
          <Group p="md" pr={11} gap="sm" wrap="nowrap" justify="space-between">
            {typeof title === 'string' ? (
              <Text fw={600} fz="md" lh={1}>
                {title}
              </Text>
            ) : (
              title
            )}
            <CloseButton />
          </Group>
        ) : (
          <Box h="sm" />
        )}
        <Box
          px={isFlush ? 4 : 'md'}
          pb={isBottom ? 'md' : HEADER_HEIGHT}
          flex={1}
          mih={0}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </Box>
      </Paper>
      <MobileFooter user={user} trigger={trigger} />
    </Paper>
  );
}

export default PhoneFrame;

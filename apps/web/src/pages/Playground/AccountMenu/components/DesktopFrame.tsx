import type { ReactNode } from 'react';
import { ActionIcon, Box, Group, Menu, Paper, Skeleton } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import UserAvatar from './UserAvatar';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
  menuWidth?: number;
  children: ReactNode;
};

/** Правый край шапки с меню аватара, застывшим в открытом виде. Пункты живые — наведение видно. */
function DesktopFrame({ user, menuWidth, children }: Props) {
  return (
    <Paper withBorder radius="md" w="100%" maw={520} h={440} pos="relative">
      <Group
        h={HEADER_HEIGHT}
        px="md"
        gap="sm"
        justify="flex-end"
        wrap="nowrap"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Skeleton animate={false} h={34} flex={1} maw={260} radius="md" />
        <Group gap={4} wrap="nowrap">
          <ActionIcon size="lg" variant="subtle" color="gray">
            <BookmarkSimpleIcon size={20} />
          </ActionIcon>
          <ActionIcon size="lg" variant="subtle" color="gray">
            <BellIcon size={20} />
          </ActionIcon>
        </Group>
        <Menu
          opened
          withinPortal={false}
          trapFocus={false}
          returnFocus={false}
          closeOnItemClick={false}
          position="bottom-end"
          width={menuWidth}
        >
          <Menu.Target>
            <Box style={{ cursor: 'pointer' }}>
              <UserAvatar user={user} size={34} />
            </Box>
          </Menu.Target>
          <Menu.Dropdown>{children}</Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );
}

export default DesktopFrame;

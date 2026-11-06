import type { ReactNode } from 'react';
import { AppShell, Badge, Button, Group } from '@mantine/core';
import { FlaskIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { APP_SHELL_HEADER } from '@/shared/lib/appShell';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ColorSchemeToggle from '@/shared/ui/ColorSchemeToggle';

type Props = { children: ReactNode };

/** Каркас прототипов без навигации и запросов авторизованного приложения. Только DEV. */
function PlaygroundLayout({ children }: Props) {
  return (
    <AppShell header={APP_SHELL_HEADER}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Button
            component={Link}
            to={ROUTE_PATHS.PLAYGROUND}
            variant="subtle"
            leftSection={<FlaskIcon size={20} />}
          >
            Песочница
          </Button>
          <Group gap="sm" wrap="nowrap">
            <Badge variant="muted" ff="monospace">
              DEV
            </Badge>
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default PlaygroundLayout;

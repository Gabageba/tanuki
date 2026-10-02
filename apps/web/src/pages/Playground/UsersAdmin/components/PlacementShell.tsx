import { useState, type ReactNode } from 'react';
import { Button, Paper, Stack, Tabs } from '@mantine/core';
import {
  BookOpenTextIcon,
  GearIcon,
  PlugsIcon,
  PlusIcon,
  TicketIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import { PLACEMENT, type Placement } from '../models';
import InvitesMock from './InvitesMock';
import PageHeader from './PageHeader';

type Props = {
  placement: Placement;
  children: ReactNode;
};

const STAFF_TAB = {
  USERS: 'users',
  INVITES: 'invites',
} as const;

/** Где экран живёт: вкладкой настроек, своей страницей или вкладкой служебной страницы. */
function PlacementShell({ placement, children }: Props) {
  const [staffTab, setStaffTab] = useState<string | null>(STAFF_TAB.USERS);

  return (
    <Paper withBorder radius="md" p="lg">
      {placement === PLACEMENT.SETTINGS_TAB && (
        <Stack gap="md">
          <PageHeader title="Настройки" />
          <Tabs value="users">
            <Tabs.List>
              <Tabs.Tab value="general" leftSection={<GearIcon />}>
                Общие
              </Tabs.Tab>
              <Tabs.Tab value="sources" leftSection={<PlugsIcon />}>
                Источники
              </Tabs.Tab>
              <Tabs.Tab value="reader" leftSection={<BookOpenTextIcon />}>
                Читалка
              </Tabs.Tab>
              <Tabs.Tab value="users" leftSection={<UsersIcon />}>
                Пользователи
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="users" mt="lg">
              {children}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}

      {placement === PLACEMENT.PAGE && (
        <Stack gap="md">
          <PageHeader title="Пользователи" withGoBack />
          {children}
        </Stack>
      )}

      {placement === PLACEMENT.STAFF_PAGE && (
        <Stack gap="md">
          <PageHeader
            title="Управление"
            withGoBack
            actions={
              staffTab === STAFF_TAB.INVITES && (
                <Button leftSection={<PlusIcon />}>Создать приглашение</Button>
              )
            }
          />
          <Tabs value={staffTab} onChange={setStaffTab}>
            <Tabs.List>
              <Tabs.Tab value={STAFF_TAB.USERS} leftSection={<UsersIcon />}>
                Пользователи
              </Tabs.Tab>
              <Tabs.Tab value={STAFF_TAB.INVITES} leftSection={<TicketIcon />}>
                Приглашения
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value={STAFF_TAB.USERS} mt="lg">
              {children}
            </Tabs.Panel>
            <Tabs.Panel value={STAFF_TAB.INVITES} mt="lg">
              <InvitesMock />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Paper>
  );
}

export default PlacementShell;

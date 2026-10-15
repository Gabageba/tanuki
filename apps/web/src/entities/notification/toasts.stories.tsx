import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Group } from '@mantine/core';
import { BellIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import type { NotificationItem } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { NOTIFICATIONS } from '@/shared/storybook/account';
import { showNotificationToast } from './toasts';

const ON_OPEN = fn().mockName('onOpen');

const showToast = (item: NotificationItem) =>
  showNotificationToast({ item, t: I18N.t, onOpen: ON_OPEN });

const META = {
  title: 'Тосты/Уведомления',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const ByType: Story = {
  name: 'По типам',
  render: () => (
    <Group gap="xs" p="md">
      {NOTIFICATIONS.map((item) => (
        <Button
          key={item.id}
          variant="default"
          leftSection={<BellIcon />}
          onClick={() => showToast(item)}
        >
          {item.type}
        </Button>
      ))}
    </Group>
  ),
  // Сразу три последних — больше на экране и не бывает (MAX_TOASTS).
  play: () => NOTIFICATIONS.slice(0, 3).forEach(showToast),
};

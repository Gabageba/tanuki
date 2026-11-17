import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button } from '@mantine/core';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { within } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import {
  EXPIRED_SOURCE_ACCOUNTS_RESPONSE,
  SOURCE_ACCOUNTS_RESPONSE,
} from '@/shared/storybook/fixtures';
import { clickEnabledButton } from '@/shared/storybook/play';
import SourceAccountMenu from './SourceAccountMenu';

const META = {
  title: 'Меню/Профиль/SourceAccountMenu',
  component: SourceAccountMenu,
  args: {
    account: SOURCE_ACCOUNTS_RESPONSE.items[0],
    isLinkingAvailable: true,
  },
  render: (args) => (
    <Box p="md">
      <SourceAccountMenu {...args} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await clickEnabledButton(
      await within(canvasElement).findByRole('button', { name: I18N.t('accountActions') }),
    );
  },
} satisfies Meta<typeof SourceAccountMenu>;

export default META;

type Story = StoryObj<typeof META>;

export const Active: Story = {
  name: 'Действующий аккаунт',
};

export const ExpiredSession: Story = {
  name: 'Сессия истекла',
  args: { account: EXPIRED_SOURCE_ACCOUNTS_RESPONSE.items[0] },
};

export const SplitButton: Story = {
  name: 'Составная кнопка входа',
  args: { account: EXPIRED_SOURCE_ACCOUNTS_RESPONSE.items[0], color: 'gold' },
  render: (args) => (
    <Box p="md">
      <Button.Group>
        <Button size="xs" variant="muted" color={args.color} leftSection={<ArrowClockwiseIcon />}>
          Войти
        </Button>
        <SourceAccountMenu {...args} />
      </Button.Group>
    </Box>
  ),
};

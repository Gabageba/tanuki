import type { Meta, StoryObj } from '@storybook/react-vite';
import { screen, userEvent } from 'storybook/test';
import ReaderSettingsButton from '.';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Читалка/ReaderSettingsButton',
  render: () => <ReaderSettingsButton />,
  play: async () => userEvent.click(await screen.findByRole('button')),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Desktop: Story = {
  name: 'Настройки читалки',
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

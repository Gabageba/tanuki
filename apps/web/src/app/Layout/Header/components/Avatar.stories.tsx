import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group } from '@mantine/core';
import { userEvent, waitFor } from 'storybook/test';
import Avatar from './Avatar';

const META = {
  title: 'Меню/Avatar',
  render: () => (
    <Group justify="flex-end" p="md">
      <Avatar />
    </Group>
  ),
  // Меню открывает сам аватар — это не кнопка, поэтому ищем его по классу Mantine.
  play: async ({ canvasElement }) => {
    const avatar = await waitFor(() => {
      const element = canvasElement.querySelector<HTMLElement>('.mantine-Avatar-root');
      if (!element) throw new Error('Аватар ещё не отрисован');
      return element;
    });
    await userEvent.click(avatar);
  },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Меню аккаунта',
};

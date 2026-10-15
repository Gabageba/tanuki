import type { Meta, StoryObj } from '@storybook/react-vite';
import BlockLoader from '.';

const META = {
  title: 'UI/BlockLoader',
  render: () => <BlockLoader />,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Спиннер блока (появляется через 200 мс)' };

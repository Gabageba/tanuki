import type { Meta, StoryObj } from '@storybook/react-vite';
import FullScreenLoader from './FullScreenLoader';

const META = {
  title: 'UI/FullScreenLoader',
  render: () => <FullScreenLoader />,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Загрузка приложения' };

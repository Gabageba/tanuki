import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import OfflineState from './OfflineState';

const META = {
  title: 'UI/OfflineState',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Нет соединения',
  render: () => <OfflineState onRetry={fn().mockName('onRetry')} />,
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import ReaderFullscreenButton from './ReaderFullscreenButton';

const META = {
  title: 'UI/Читалка/ReaderFullscreenButton',
  component: ReaderFullscreenButton,
  args: { fullscreen: { active: false, supported: true, toggle: async () => {} } },
} satisfies Meta<typeof ReaderFullscreenButton>;

export default META;
type Story = StoryObj<typeof META>;

export const Available: Story = { name: 'На весь экран' };
export const Active: Story = {
  name: 'Полноэкранный режим включён',
  args: { fullscreen: { ...META.args.fullscreen, active: true } },
};
export const Unsupported: Story = {
  name: 'Нет поддержки',
  args: { fullscreen: { ...META.args.fullscreen, supported: false } },
};

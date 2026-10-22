import type { Meta, StoryObj } from '@storybook/react-vite';
import ReaderSettingsButton from '.';
import { MOBILE_GLOBALS, STORY_FOOTER } from '@/shared/storybook/models';
import { clickFirstButton } from '@/shared/storybook/play';

const META = {
  title: 'Дроверы/Читалка/ReaderSettingsButton',
  render: () => <ReaderSettingsButton />,
  // В читалке нижней панели приложения нет — и места под неё тоже.
  parameters: { footer: STORY_FOOTER.NONE },
  play: clickFirstButton,
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

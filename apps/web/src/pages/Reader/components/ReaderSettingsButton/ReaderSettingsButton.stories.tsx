import type { Meta, StoryObj } from '@storybook/react-vite';
import ReaderSettingsButton from '.';
import { READER_READING_MODE, READER_PAGE_LAYOUT, READER_DIRECTION } from '@tanuki/contracts';
import { getReaderSettingsHandler } from '@/shared/storybook/reader';
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

export const Paged: Story = {
  name: 'Постраничный режим и разворот',
  parameters: {
    msw: [
      getReaderSettingsHandler({
        readingMode: READER_READING_MODE.HORIZONTAL,
        pageLayout: READER_PAGE_LAYOUT.SPREAD,
        direction: READER_DIRECTION.RTL,
      }),
    ],
  },
};

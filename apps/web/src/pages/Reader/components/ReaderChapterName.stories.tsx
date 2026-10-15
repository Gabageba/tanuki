import type { Meta, StoryObj } from '@storybook/react-vite';
import { screen, userEvent } from 'storybook/test';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import { BOOKMARK_ITEM, CHAPTERS } from '@/shared/storybook/fixtures';
import ReaderChapterName from './ReaderChapterName';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Читалка/ReaderChapterName',
  render: () => (
    <ReaderChapterName
      chapters={CHAPTERS}
      numbering={CHAPTER_NUMBERING.GLOBAL}
      currentChapter={CHAPTERS[4]!}
      titleId={BOOKMARK_ITEM.titleId}
    />
  ),
  play: async () => userEvent.click(await screen.findByRole('button')),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Desktop: Story = {
  name: 'Список глав',
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

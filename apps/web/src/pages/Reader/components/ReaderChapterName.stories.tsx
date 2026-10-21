import type { Meta, StoryObj } from '@storybook/react-vite';
import { CHAPTER_NUMBERING } from '@tanuki/contracts';
import { BOOKMARK_ITEM, CHAPTERS } from '@/shared/storybook/fixtures';
import ReaderChapterName from './ReaderChapterName';
import { MOBILE_GLOBALS, STORY_FOOTER } from '@/shared/storybook/models';
import { clickFirstButton } from '@/shared/storybook/play';

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
  // В читалке нижней панели приложения нет — и места под неё тоже.
  parameters: { footer: STORY_FOOTER.NONE },
  play: clickFirstButton,
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

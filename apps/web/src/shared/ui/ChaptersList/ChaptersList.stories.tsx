import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { fn, userEvent, within } from 'storybook/test';
import { CHAPTER_NUMBERING, READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { LinkedReadingMark, ReadingMark } from '@/entities/title/models';
import {
  LINKED_PROGRESS,
  READING_PROGRESS_RESPONSE,
  TITLE,
  TITLE_CHAPTERS,
} from '@/shared/storybook/titles';
import ChaptersList from '.';

// Отметки — в верхней части списка: он виртуальный, и строки ниже экрана не отрисованы.
const OWN_MARK: ReadingMark = {
  chapter: TITLE_CHAPTERS.find(({ number }) => number === 35)!,
  pageIndex: 3,
  confidence: READING_MARK_CONFIDENCE.EXACT,
  progress: READING_PROGRESS_RESPONSE.own!,
};

const LINKED_MARK: LinkedReadingMark = {
  chapter: TITLE_CHAPTERS.find(({ number }) => number === 38)!,
  pageIndex: 0,
  confidence: READING_MARK_CONFIDENCE.EXACT,
  progress: LINKED_PROGRESS,
};

const ON_MARK = fn().mockName('onMarkChapter');

const META = {
  title: 'UI/ChaptersList',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Plain: Story = {
  name: 'Без отметок',
  render: () => (
    <Box p="md" maw={560}>
      <ChaptersList
        chapters={TITLE_CHAPTERS}
        numbering={CHAPTER_NUMBERING.GLOBAL}
        titleId={TITLE.id}
        mah={480}
        showDate
        onMarkChapter={ON_MARK}
      />
    </Box>
  ),
};

export const WithMarks: Story = {
  name: 'Своя отметка, отметка другого источника и новые главы',
  render: () => (
    <Box p="md" maw={560}>
      <ChaptersList
        chapters={TITLE_CHAPTERS}
        numbering={CHAPTER_NUMBERING.GLOBAL}
        titleId={TITLE.id}
        mah={480}
        showDate
        ownMark={OWN_MARK}
        linkedMarks={[LINKED_MARK]}
        newChapterIds={new Set(TITLE_CHAPTERS.slice(0, 2).map(({ id }) => id))}
        onMarkChapter={ON_MARK}
      />
    </Box>
  ),
};

export const LinkedMarkPopover: Story = {
  name: 'Поповер отметки другого источника',
  render: WithMarks.render,
  play: async ({ canvasElement }) => {
    // У кнопки отметки нет своей подписи — находим её по аватару источника внутри.
    await within(canvasElement).findAllByRole('button');
    const button = canvasElement.querySelector('button .mantine-Avatar-root')?.closest('button');
    if (button) await userEvent.click(button);
  },
};

export const PerVolume: Story = {
  name: 'Нумерация по томам',
  render: () => (
    <Box p="md" maw={560}>
      <ChaptersList
        chapters={TITLE_CHAPTERS}
        numbering={CHAPTER_NUMBERING.PER_VOLUME}
        titleId={TITLE.id}
        mah={480}
        ownMark={OWN_MARK}
      />
    </Box>
  ),
};

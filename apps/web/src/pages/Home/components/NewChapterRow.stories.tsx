import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { CONTENT_RATING } from '@tanuki/contracts';
import { FAVORITE_FOLDER } from '@/shared/storybook/fixtures';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { BOOKMARK_CARD } from '@/shared/storybook/titleCard/fixtures';
import { checkTitleCardPair } from '@/shared/storybook/titleCard/play';
import NewChapterRow from './NewChapterRow';
import NewChapterRowSkeleton from './NewChapterRowSkeleton';

const META = {
  title: 'Карточки/NewChapterRow',
  component: NewChapterRow,
  args: { bookmark: BOOKMARK_CARD, folder: FAVORITE_FOLDER },
  render: (args) => (
    <Box p="md" maw={520}>
      <NewChapterRow {...args} />
    </Box>
  ),
} satisfies Meta<typeof NewChapterRow>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Новые главы рядом со скелетоном',
  render: (args) => (
    <SkeletonCompare
      w={{ base: 'calc(100vw - 32px)', sm: 480 }}
      cols={{ base: 1, lg: 2 }}
      item={<NewChapterRow {...args} />}
      skeleton={<NewChapterRowSkeleton />}
    />
  ),
  play: checkTitleCardPair,
};

export const Mobile: Story = {
  name: 'На телефоне: 18+ и метка папки',
  args: { bookmark: { ...BOOKMARK_CARD, contentRating: CONTENT_RATING.ADULT } },
  globals: MOBILE_GLOBALS,
};

export const UnknownChapter: Story = {
  name: 'Номер и дата новой главы неизвестны',
  args: {
    bookmark: { ...BOOKMARK_CARD, latestChapterNumber: null, latestNewAt: null },
    folder: null,
  },
};

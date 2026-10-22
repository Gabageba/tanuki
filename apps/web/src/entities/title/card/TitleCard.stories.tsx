import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, SimpleGrid } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import { FAVORITE_FOLDER } from '@/shared/storybook/fixtures';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { TITLES } from '@/shared/storybook/titles';
import TitleCardSkeleton from './TitleCardSkeleton';
import TitleCardsGridSkeleton from './TitleCardsGridSkeleton';
import TitleCardsScroller from './TitleCardsScroller';
import TitleCard from './TitleCard';

const ADULT_TITLE = TITLES.find(({ slug }) => slug === 'adult-sample')!;
const NO_RATING_TITLE = TITLES.find(({ rating }) => rating === null)!;

const META = {
  title: 'Карточки/TitleCard',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Grid: Story = {
  name: 'Плитка: обычная, в закладках, без рейтинга, 18+',
  render: () => (
    <SimpleGrid cols={4} p="md" maw={760}>
      <TitleCard title={TITLES[0]!} />
      <TitleCard title={TITLES[1]!} bookmarkFolder={FAVORITE_FOLDER} />
      <TitleCard title={NO_RATING_TITLE} showSource />
      <TitleCard title={ADULT_TITLE} />
    </SimpleGrid>
  ),
};

export const List: Story = {
  name: 'Строка списка',
  render: () => (
    <SimpleGrid cols={1} p="md" maw={560}>
      <TitleCard title={TITLES[0]!} viewMode={VIEW_MODE.LIST} />
      <TitleCard title={TITLES[1]!} viewMode={VIEW_MODE.LIST} bookmarkFolder={FAVORITE_FOLDER} />
      <TitleCard title={ADULT_TITLE} viewMode={VIEW_MODE.LIST} showSource />
    </SimpleGrid>
  ),
};

export const GridWithSkeleton: Story = {
  name: 'Плитка рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={180}
      item={<TitleCard title={TITLES[0]!} />}
      skeleton={<TitleCardSkeleton viewMode={VIEW_MODE.GRID} />}
    />
  ),
};

export const ListWithSkeleton: Story = {
  name: 'Строка списка рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={520}
      item={<TitleCard title={TITLES[0]!} viewMode={VIEW_MODE.LIST} />}
      skeleton={<TitleCardSkeleton viewMode={VIEW_MODE.LIST} />}
    />
  ),
};

export const GridSkeleton: Story = {
  name: 'Скелетон сетки',
  render: () => (
    <Box p="md">
      <TitleCardsGridSkeleton viewMode={VIEW_MODE.GRID} />
    </Box>
  ),
};

export const Scroller: Story = {
  name: 'Лента карточек',
  render: () => (
    <Box p="md">
      <TitleCardsScroller
        items={TITLES}
        getBookmarkFolder={(titleId) => (titleId === TITLES[2]!.id ? FAVORITE_FOLDER : null)}
      />
    </Box>
  ),
};

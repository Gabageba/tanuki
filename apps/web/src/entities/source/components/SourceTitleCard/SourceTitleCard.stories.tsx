import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, SimpleGrid } from '@mantine/core';
import { expect, waitFor } from 'storybook/test';
import { VIEW_MODE } from '@tanuki/contracts';
import { FAVORITE_FOLDER } from '@/shared/storybook/fixtures';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { TITLES } from '@/shared/storybook/titles';
import { CATALOG_CARD } from '@/shared/storybook/titleCard/fixtures';
import { checkTitleCardPair } from '@/shared/storybook/titleCard/play';
import SourceTitleCardSkeleton from './SourceTitleCardSkeleton';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import TitleCardsScroller from '@/entities/title/card/TitleCardsScroller';
import SourceTitleCard from './SourceTitleCard';

const ADULT_TITLE = TITLES.find(({ slug }) => slug === 'adult-sample')!;
const NO_RATING_TITLE = TITLES.find(({ rating }) => rating === null)!;

const META = {
  title: 'Карточки/SourceTitleCard',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Grid: Story = {
  name: 'Плитка: обычная, в закладках, без рейтинга, 18+',
  render: () => (
    <SimpleGrid cols={4} p="md" maw={760}>
      <SourceTitleCard title={TITLES[0]!} />
      <SourceTitleCard title={TITLES[1]!} bookmarkFolder={FAVORITE_FOLDER} />
      <SourceTitleCard title={NO_RATING_TITLE} showSource />
      <SourceTitleCard title={ADULT_TITLE} />
    </SimpleGrid>
  ),
};

export const List: Story = {
  name: 'Строка списка',
  render: () => (
    <SimpleGrid cols={1} p="md" maw={560}>
      <SourceTitleCard title={TITLES[0]!} viewMode={VIEW_MODE.LIST} />
      <SourceTitleCard
        title={TITLES[1]!}
        viewMode={VIEW_MODE.LIST}
        bookmarkFolder={FAVORITE_FOLDER}
      />
      <SourceTitleCard title={ADULT_TITLE} viewMode={VIEW_MODE.LIST} showSource />
    </SimpleGrid>
  ),
  play: async (context) => {
    await document.fonts.ready;
    const tags = context.canvasElement.querySelector('[data-card-tags]')!;

    await waitFor(async () => {
      const badges = Array.from(tags.children);
      const overflow = badges.at(-1)!;
      await expect(overflow.textContent).toMatch(/^\+\d+$/);
      const hiddenCount = Number(overflow.textContent?.slice(1));
      await expect(badges.length - 1 + hiddenCount).toBe(TITLES[0]!.tags.length);

      const bounds = tags.getBoundingClientRect();
      for (const badge of badges) {
        const rect = badge.getBoundingClientRect();
        await expect(rect.left).toBeGreaterThanOrEqual(bounds.left);
        await expect(rect.right).toBeLessThanOrEqual(bounds.right + 0.5);
      }
    });
  },
};

export const GridWithSkeleton: Story = {
  name: 'Плитка рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={180}
      item={<SourceTitleCard title={CATALOG_CARD} />}
      skeleton={<SourceTitleCardSkeleton viewMode={VIEW_MODE.GRID} />}
    />
  ),
  play: checkTitleCardPair,
};

export const ListWithSkeleton: Story = {
  name: 'Строка списка рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={520}
      item={<SourceTitleCard title={CATALOG_CARD} viewMode={VIEW_MODE.LIST} />}
      skeleton={<SourceTitleCardSkeleton viewMode={VIEW_MODE.LIST} />}
    />
  ),
  play: checkTitleCardPair,
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

export const NoMetadata: Story = {
  name: 'Нет метаданных, описания и оценки',
  render: () => (
    <SimpleGrid cols={{ base: 1, sm: 2 }} p="md" maw={760}>
      {[VIEW_MODE.GRID, VIEW_MODE.LIST].map((viewMode) => (
        <Box key={viewMode} maw={viewMode === VIEW_MODE.GRID ? 180 : undefined}>
          <SourceTitleCard
            viewMode={viewMode}
            title={{
              ...CATALOG_CARD,
              type: null,
              year: null,
              chaptersCount: null,
              pages: null,
              releaseState: null,
              description: null,
              rating: null,
              likes: null,
              tags: [],
            }}
          />
        </Box>
      ))}
    </SimpleGrid>
  ),
  play: async ({ canvasElement }) => {
    for (const meta of canvasElement.querySelectorAll('[data-card-meta]')) {
      await expect(meta).not.toBeVisible();
    }
    await expect(canvasElement.querySelector('[data-card-footer]')).not.toBeVisible();
  },
};

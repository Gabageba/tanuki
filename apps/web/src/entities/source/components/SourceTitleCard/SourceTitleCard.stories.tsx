import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, SimpleGrid } from '@mantine/core';
import { expect, waitFor } from 'storybook/test';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { CONTENT_RATING, TITLE_TYPE, VIEW_MODE } from '@tanuki/contracts';
import { FAVORITE_FOLDER } from '@/shared/storybook/fixtures';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { POPULAR_TITLES, TITLES } from '@/shared/storybook/titles';
import { CATALOG_CARD } from '@/shared/storybook/titleCard/fixtures';
import { checkTitleCardPair } from '@/shared/storybook/titleCard/play';
import SourceTitleCardSkeleton from './SourceTitleCardSkeleton';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import TitleCardsScroller from '@/entities/title/card/TitleCardsScroller';
import SourceTitleCard from './SourceTitleCard';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';

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

export const Coverless: Story = {
  name: 'Без обложки: папка, 18+, длинные данные и ноль лайков',
  render: () => (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" p="md">
      {POPULAR_TITLES.slice(0, 4).map((title, index) => (
        <SourceTitleCard
          key={title.id}
          title={title}
          viewMode={VIEW_MODE.COVERLESS}
          bookmarkFolder={index === 0 ? FAVORITE_FOLDER : null}
        />
      ))}
    </SimpleGrid>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('img')).toBeNull();
    await expect(canvasElement.querySelectorAll('[data-view-mode="coverless"]')).toHaveLength(4);
    await expect(canvasElement.querySelector('[data-card-footer]')?.textContent).toContain('0');
  },
};

export const CoverlessMobile: Story = {
  ...Coverless,
  name: 'Без обложки на телефоне',
  globals: MOBILE_GLOBALS,
};

export const CoverlessTypeOnly: Story = {
  name: 'Nude-Moon: только тип в мета-строке',
  render: () => (
    <Box p="md" maw={440}>
      <SourceTitleCard
        title={{
          ...POPULAR_TITLES[0]!,
          type: TITLE_TYPE.MANGA,
          year: null,
          chaptersCount: null,
          pages: null,
          releaseState: null,
        }}
        viewMode={VIEW_MODE.COVERLESS}
        bookmarkFolder={FAVORITE_FOLDER}
      />
    </Box>
  ),
};

export const CoverlessWithSkeleton: Story = {
  name: 'Без обложки рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={440}
      item={
        <SourceTitleCard
          title={POPULAR_TITLES[1]!}
          viewMode={VIEW_MODE.COVERLESS}
          bookmarkFolder={FAVORITE_FOLDER}
        />
      }
      skeleton={<SourceTitleCardSkeleton viewMode={VIEW_MODE.COVERLESS} />}
    />
  ),
};

export const CoverlessNoMetadata: Story = {
  name: 'Без обложки и метаданных',
  render: () => (
    <Box p="md" maw={440}>
      <SourceTitleCard
        title={{
          ...POPULAR_TITLES[0]!,
          contentRating: CONTENT_RATING.SAFE,
          type: null,
          year: null,
          chaptersCount: null,
          pages: null,
          releaseState: null,
          description: null,
          tags: [],
          likes: null,
        }}
        viewMode={VIEW_MODE.COVERLESS}
      />
    </Box>
  ),
};

export const CoverlessLong: Story = {
  name: 'Без обложки: длинное название и имя папки',
  globals: MOBILE_GLOBALS,
  render: () => (
    <Box p="md" maw={360}>
      <SourceTitleCard
        title={{
          ...POPULAR_TITLES[0]!,
          name: 'Очень длинное название тайтла, которое не помещается в две строки на узком экране телефона',
          tags: [...POPULAR_TITLES[0]!.tags, ...POPULAR_TITLES[1]!.tags],
        }}
        viewMode={VIEW_MODE.COVERLESS}
        bookmarkFolder={{
          ...FAVORITE_FOLDER,
          name: 'Очень длинное название папки для любимых тайтлов',
        }}
      />
    </Box>
  ),
};

export const CoverlessMetadataFallback: Story = {
  name: 'Без обложки: мета, перенос маркеров и одинаковая высота',
  render: () => (
    <Box p="md" maw={1000}>
      <ViewModeGrid viewMode={VIEW_MODE.COVERLESS}>
        <SourceTitleCard
          title={{ ...POPULAR_TITLES[0]!, description: null }}
          viewMode={VIEW_MODE.COVERLESS}
          bookmarkFolder={FAVORITE_FOLDER}
        />
        <SourceTitleCard
          title={{
            ...POPULAR_TITLES[1]!,
            type: null,
            year: null,
            chaptersCount: null,
            pages: null,
            releaseState: null,
            description:
              'Описание занимает несколько строк, чтобы проверить растягивание соседней карточки и выравнивание нижней строки с тегами и оценкой.',
          }}
          viewMode={VIEW_MODE.COVERLESS}
          bookmarkFolder={FAVORITE_FOLDER}
        />
      </ViewModeGrid>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const cards = Array.from(canvasElement.querySelectorAll('[data-title-card]'));
    await expect(cards).toHaveLength(2);
    await waitFor(async () => {
      for (const [index, card] of cards.entries()) {
        const name = card.querySelector('[data-card-name]')!.getBoundingClientRect();
        const meta = card.querySelector('[data-card-meta-content]')!.getBoundingClientRect();
        const adult = card.querySelector('[data-card-adult-tag]')!.getBoundingClientRect();
        const folder = card.querySelector('[role="img"]')!.getBoundingClientRect();
        await expect(adult.top).toBeCloseTo(folder.top, 0);
        if (index === 0) {
          await expect(meta.bottom).toBeLessThanOrEqual(name.top);
          await expect(adult.bottom).toBeLessThanOrEqual(name.top);
        } else {
          await expect(meta.height).toBe(0);
          await expect(adult.left).toBeGreaterThanOrEqual(name.right);
          await expect(adult.top + adult.height / 2).toBeCloseTo(
            name.top +
              Number.parseFloat(
                getComputedStyle(card.querySelector('[data-card-name]')!).lineHeight,
              ) /
                2,
            0,
          );
        }
      }
      const [first, second] = cards.map((card) => card.getBoundingClientRect());
      if (Math.abs(first!.top - second!.top) < 1) {
        await expect(first!.height).toBeCloseTo(second!.height, 0);
        const footers = cards.map((card) =>
          card.querySelector('[data-card-footer]')!.getBoundingClientRect(),
        );
        await expect(footers[0]!.bottom).toBeCloseTo(footers[1]!.bottom, 0);
      }
    });
  },
};

export const CoverlessMetadataFallbackMobile: Story = {
  ...CoverlessMetadataFallback,
  name: 'Без обложки: перенос маркеров на телефоне',
  globals: MOBILE_GLOBALS,
};

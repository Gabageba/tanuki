import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BOOKMARK_AVAILABILITY, CONTENT_RATING, VIEW_MODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { clickFirstButton } from '@/shared/storybook/play';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { BOOKMARK_CARD } from '@/shared/storybook/titleCard/fixtures';
import { checkBookmarkCardPair } from '@/shared/storybook/titleCard/play';
import BookmarkCard from './BookmarkCard';
import BookmarkCardSkeleton from './BookmarkCardSkeleton';

const META = {
  title: 'Карточки/BookmarkCard',
  component: BookmarkCard,
  args: { bookmark: BOOKMARK_CARD, viewMode: VIEW_MODE.GRID },
  render: (args) => (
    <Box p="md" maw={520}>
      <BookmarkCard {...args} />
    </Box>
  ),
} satisfies Meta<typeof BookmarkCard>;

export default META;

type Story = StoryObj<typeof META>;

export const Grid: Story = {
  name: 'Плитка с новыми главами рядом со скелетоном',
  render: (args) => (
    <SkeletonCompare
      w={180}
      cols={{ base: 1, xs: 2 }}
      item={<BookmarkCard {...args} />}
      skeleton={<BookmarkCardSkeleton viewMode={args.viewMode} />}
    />
  ),
  play: checkBookmarkCardPair,
};

export const List: Story = {
  name: 'Компактный список рядом со скелетоном',
  args: { viewMode: VIEW_MODE.LIST },
  render: (args) => (
    <SkeletonCompare
      w={{ base: 'calc(100vw - 32px)', sm: 480 }}
      cols={{ base: 1, lg: 2 }}
      item={<BookmarkCard {...args} />}
      skeleton={<BookmarkCardSkeleton viewMode={args.viewMode} />}
    />
  ),
  play: checkBookmarkCardPair,
};

export const Mobile: Story = {
  name: 'На телефоне: длинный прогресс и название',
  args: { viewMode: VIEW_MODE.LIST },
  globals: MOBILE_GLOBALS,
};

export const NoUpdates: Story = {
  name: 'Без новых глав: серый прогресс',
  args: { bookmark: { ...BOOKMARK_CARD, newChaptersCount: 0 } },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('img', { name: I18N.t('hasNewChapters') }),
    ).toBeNull();
    const progress = canvasElement.querySelector<HTMLElement>('[data-card-progress]')!;
    await expect(progress.style.color).toBe('');
  },
};

export const NoProgress: Story = {
  name: 'Не проверено: серый текст без отметки и известного типа',
  args: { bookmark: { ...BOOKMARK_CARD, progress: null, chaptersCount: null, type: null } },
  render: (args) => (
    <Box p="md" w={200}>
      <BookmarkCard {...args} />
    </Box>
  ),
};

export const HiddenUnavailable: Story = {
  name: 'Недоступная закладка со скрытой обложкой 18+',
  args: {
    viewMode: VIEW_MODE.LIST,
    bookmark: {
      ...BOOKMARK_CARD,
      contentRating: CONTENT_RATING.ADULT,
      availability: BOOKMARK_AVAILABILITY.SOURCE_DOWN,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('img', { name: I18N.t('hasNewChapters') })).toBeNull();
    await expect(
      canvasElement.querySelector<HTMLElement>('[data-card-progress]')!.style.color,
    ).toBe('');
    await expect(canvas.getByText(I18N.t('sourceUnavailable'))).toBeVisible();
    await expect(canvas.queryByRole('img', { name: I18N.t('adultContentHidden') })).toBeNull();
    const imageLayer = canvasElement.querySelector('[data-card-cover] > div')!;
    await expect(getComputedStyle(imageLayer).filter).toBe('grayscale(1) blur(20px)');
  },
};

export const Unavailable: Story = {
  name: 'Недоступная закладка: лёгкое размытие и причина',
  args: { bookmark: { ...BOOKMARK_CARD, availability: BOOKMARK_AVAILABILITY.TITLE_MISSING } },
  render: (args) => (
    <Box p="md" w={200}>
      <BookmarkCard {...args} />
    </Box>
  ),
};

export const Menu: Story = {
  name: 'Меню вне ссылки и перенос в папку',
  args: { viewMode: VIEW_MODE.LIST },
  play: async (context) => {
    await expect(context.canvasElement.querySelector('a button')).toBeNull();
    await clickFirstButton(context);
    const body = within(document.body);
    await userEvent.click(await body.findByRole('menuitem', { name: I18N.t('moveToFolder') }));
    await waitFor(async () => {
      await expect(body.getByRole('dialog')).toBeVisible();
    });
    await expect(
      within(context.canvasElement).getByRole('link', { name: BOOKMARK_CARD.name }),
    ).toHaveAttribute('href', '/title/readmanga_ru:berserk');
  },
};

export const MenuOpened: Story = {
  name: 'Открытое меню со ссылками на источники',
  play: async (context) => {
    await clickFirstButton(context);
    const body = within(document.body);
    await waitFor(async () => {
      await expect(body.getByRole('menu')).toBeVisible();
    });
    const menu = body.getByRole('menu');
    await expect(within(menu).getByText(I18N.t('openOnSource'))).toBeVisible();
    await expect(menu.querySelectorAll('a[role="menuitem"]')).toHaveLength(
      BOOKMARK_CARD.otherSources.length + 1,
    );
    await expect(menu.querySelectorAll('.mantine-Menu-divider')).toHaveLength(1);
  },
};

export const MenuWithoutOtherSources: Story = {
  name: 'Меню без других источников',
  args: { bookmark: { ...BOOKMARK_CARD, otherSources: [] } },
  play: async (context) => {
    await clickFirstButton(context);
    const body = within(document.body);
    await waitFor(async () => {
      await expect(body.getByRole('menu')).toBeVisible();
    });
    const menu = body.getByRole('menu');
    await expect(within(menu).queryByText(I18N.t('openOnSource'))).toBeNull();
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
    await expect(menu.querySelectorAll('.mantine-Menu-divider')).toHaveLength(0);
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import { clickFirstButton } from '@/shared/storybook/play';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { CONTINUE_CARD } from '@/shared/storybook/titleCard/fixtures';
import { checkTitleCardPair } from '@/shared/storybook/titleCard/play';
import ContinueReadingCard from './ContinueReadingCard';
import ContinueReadingCardSkeleton from './ContinueReadingCardSkeleton';

const ON_REMOVE = fn();

const META = {
  title: 'Карточки/ContinueReadingCard',
  component: ContinueReadingCard,
  args: { item: CONTINUE_CARD, onRemove: ON_REMOVE },
  render: (args) => (
    <Box p="md" w={200}>
      <ContinueReadingCard {...args} />
    </Box>
  ),
} satisfies Meta<typeof ContinueReadingCard>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Продолжение чтения рядом со скелетоном',
  render: (args) => (
    <SkeletonCompare
      w={168}
      cols={{ base: 1, xs: 2 }}
      item={<ContinueReadingCard {...args} />}
      skeleton={<ContinueReadingCardSkeleton />}
    />
  ),
  play: checkTitleCardPair,
};

export const Remove: Story = {
  name: 'Убрать через меню без перехода на тайтл',
  play: async (context) => {
    ON_REMOVE.mockClear();
    await expect(context.canvasElement.querySelector('a button')).toBeNull();
    await clickFirstButton(context);
    await userEvent.click(
      await within(document.body).findByRole('menuitem', {
        name: I18N.t('removeFromContinueReading'),
      }),
    );
    await expect(ON_REMOVE).toHaveBeenCalledTimes(1);
    await expect(
      within(context.canvasElement).getByRole('link', { name: CONTINUE_CARD.title.name }),
    ).toHaveAttribute('href', `/title/${CONTINUE_CARD.title.id}`);
  },
};

export const MenuOpened: Story = {
  name: 'Открытое меню',
  play: async (context) => {
    await clickFirstButton(context);
    await waitFor(async () => {
      await expect(
        within(document.body).getByRole('menuitem', {
          name: I18N.t('removeFromContinueReading'),
        }),
      ).toBeVisible();
    });
  },
};

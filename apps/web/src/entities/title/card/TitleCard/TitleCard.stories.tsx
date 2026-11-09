import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { VIEW_MODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import TitleCardExamplePair from '@/shared/storybook/titleCard/TitleCardExamplePair';
import {
  checkActionsOnlyPair,
  checkAdultTitleCardPair,
  checkTitleCardPair,
} from '@/shared/storybook/titleCard/play';
import { clickFirstButton } from '@/shared/storybook/play';
import { EXAMPLE_ACTION_TO, EXAMPLE_MOVE_ACTION } from '@/shared/storybook/titleCard/models';
import { TITLE_CARD_LIST_SIZE } from './models';

const META = {
  title: 'Карточки/TitleCard',
  component: TitleCardExamplePair,
  play: checkTitleCardPair,
} satisfies Meta<typeof TitleCardExamplePair>;

export default META;

type Story = StoryObj<typeof META>;

export const Grid: Story = {
  name: 'Плитка рядом со скелетоном',
  args: { detailed: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    await expect(context.canvasElement.querySelector('[data-card-footer]')).toBeNull();
    await expect(within(context.canvasElement).queryByText(I18N.t('ongoing'))).toBeNull();
  },
};

export const List: Story = {
  name: 'Список 120: описание и нижняя строка',
  args: { viewMode: VIEW_MODE.LIST, detailed: true },
};

export const Compact: Story = {
  name: 'Список 84: прогресс и меню',
  args: {
    viewMode: VIEW_MODE.LIST,
    listSize: TITLE_CARD_LIST_SIZE.COMPACT,
    withActions: true,
  },
};

export const Actions: Story = {
  name: 'Меню в мета-строке',
  args: { withActions: true },
};

export const NoSlots: Story = {
  name: 'Без метаданных, действий и нижней строки',
  args: { withMeta: false },
  play: async (context) => {
    await checkTitleCardPair(context);
    await expect(context.canvasElement.querySelector('[data-card-meta]')).not.toBeVisible();
    await expect(context.canvasElement.querySelector('[data-card-footer]')).toBeNull();
  },
};

export const ActionsOnly: Story = {
  name: 'Действия без метаданных',
  args: { withMeta: false, withActions: true },
  play: checkActionsOnlyPair,
};

export const ActionsOnlyList: Story = {
  name: 'Список: действия без метаданных',
  args: { viewMode: VIEW_MODE.LIST, withMeta: false, withActions: true },
  play: checkActionsOnlyPair,
};

export const Zero: Story = {
  name: 'Ноль в метаданных',
  args: { zero: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    const meta = context.canvasElement.querySelector('[data-card-meta]');
    await expect(meta?.textContent).toBe('');
    await expect(meta).not.toBeVisible();
  },
};

export const EmptyMeta: Story = {
  name: 'Внешние метаданные вернули null',
  args: { emptyMeta: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    await expect(context.canvasElement.querySelector('[data-card-meta]')).not.toBeVisible();
  },
};

export const NoCover: Story = {
  name: 'Нет обложки',
  args: { noCover: true },
};

export const HiddenGrid: Story = {
  name: 'Скрытая обложка: плитка',
  args: { hidden: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    await expect(
      within(context.canvasElement).getByRole('img', { name: I18N.t('adultContentHidden') }),
    ).toBeVisible();
  },
};

export const HiddenList: Story = {
  name: 'Скрытая обложка: список',
  args: { viewMode: VIEW_MODE.LIST, listSize: TITLE_CARD_LIST_SIZE.COMPACT, hidden: true },
};

export const CoverOverlay: Story = {
  name: 'Недоступная обложка с причиной',
  args: { overlay: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    await expect(
      within(context.canvasElement).getByText(I18N.t('sourceUnavailable')),
    ).toBeVisible();
  },
};

export const HiddenCoverOverlay: Story = {
  name: 'Оверлей поверх скрытой обложки',
  args: {
    viewMode: VIEW_MODE.LIST,
    listSize: TITLE_CARD_LIST_SIZE.COMPACT,
    hidden: true,
    overlay: true,
  },
  play: async (context) => {
    await checkTitleCardPair(context);
    await expect(
      within(context.canvasElement).queryByRole('img', { name: I18N.t('adultContentHidden') }),
    ).toBeNull();
    await expect(
      within(context.canvasElement).getByText(I18N.t('sourceUnavailable')),
    ).toBeVisible();
  },
};

export const Mobile: Story = {
  name: 'На телефоне: длинный прогресс и название',
  args: {
    viewMode: VIEW_MODE.LIST,
    listSize: TITLE_CARD_LIST_SIZE.COMPACT,
    withActions: true,
  },
  globals: MOBILE_GLOBALS,
};

export const ListMobile: Story = {
  name: 'На телефоне: подробный список',
  args: { viewMode: VIEW_MODE.LIST, detailed: true },
  globals: MOBILE_GLOBALS,
};

export const MenuOpened: Story = {
  name: 'Открытое меню',
  args: { withActions: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    await clickFirstButton(context);
    await waitFor(async () => {
      await expect(
        within(document.body).getByRole('menuitem', { name: I18N.t('moveToFolder') }),
      ).toBeVisible();
    });
    await expect(
      within(document.body).getByRole('menuitem', { name: I18N.t('openOnSource') }),
    ).toHaveAttribute('href', EXAMPLE_ACTION_TO);
  },
};

export const MenuAction: Story = {
  name: 'Действие вызывает переданный обработчик',
  args: { withActions: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    EXAMPLE_MOVE_ACTION.mockClear();
    await clickFirstButton(context);
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: I18N.t('moveToFolder') }),
    );
    await expect(EXAMPLE_MOVE_ACTION).toHaveBeenCalledTimes(1);
    await waitFor(
      async () => await expect(within(document.body).queryByRole('menu')).not.toBeInTheDocument(),
    );
    await expect(context.canvasElement.querySelectorAll('[data-title-card]')).toHaveLength(2);
  },
};

export const DisabledAction: Story = {
  name: 'Недоступное действие',
  args: { withActions: true, disabledAction: true },
  play: async (context) => {
    await checkTitleCardPair(context);
    EXAMPLE_MOVE_ACTION.mockClear();
    await clickFirstButton(context);
    const action = await within(document.body).findByRole('menuitem', {
      name: I18N.t('moveToFolder'),
    });
    await expect(action).toHaveAttribute('data-disabled');
    await expect(action).toBeDisabled();
    await expect(EXAMPLE_MOVE_ACTION).not.toHaveBeenCalled();
  },
};

export const ListWithoutSlots: Story = {
  name: 'Список без слотов',
  args: { viewMode: VIEW_MODE.LIST, withMeta: false },
};

export const AdultList: Story = {
  name: 'Список 120: 18+ в мета-строке',
  args: { viewMode: VIEW_MODE.LIST, detailed: true, hidden: true },
  play: checkAdultTitleCardPair,
};

export const AdultCompact: Story = {
  name: 'Список 84: 18+ и меню',
  args: {
    viewMode: VIEW_MODE.LIST,
    listSize: TITLE_CARD_LIST_SIZE.COMPACT,
    withActions: true,
    hidden: true,
  },
  play: checkAdultTitleCardPair,
};

export const AdultNoSlots: Story = {
  name: '18+ без метаданных',
  args: { viewMode: VIEW_MODE.LIST, withMeta: false, hidden: true },
  play: async (context) => {
    await checkAdultTitleCardPair(context);
    await expect(context.canvasElement.querySelector('[data-card-meta-content]')).not.toBeVisible();
  },
};

export const AdultActionsOnly: Story = {
  name: '18+ и меню без метаданных',
  args: { viewMode: VIEW_MODE.LIST, withMeta: false, withActions: true, hidden: true },
  play: async (context) => {
    await checkAdultTitleCardPair(context);
    await checkActionsOnlyPair(context);
  },
};

export const AdultMobile: Story = {
  name: 'На телефоне: 18+ в компактной карточке',
  args: {
    viewMode: VIEW_MODE.LIST,
    listSize: TITLE_CARD_LIST_SIZE.COMPACT,
    withActions: true,
    hidden: true,
  },
  globals: MOBILE_GLOBALS,
  play: checkAdultTitleCardPair,
};

export const AdultListMobile: Story = {
  name: 'На телефоне: 18+ в подробной карточке',
  args: { viewMode: VIEW_MODE.LIST, detailed: true, hidden: true },
  globals: MOBILE_GLOBALS,
  play: checkAdultTitleCardPair,
};

export const AdultGrid: Story = {
  name: 'Плитка: 18+ в мета-строке',
  args: { hidden: true },
  play: checkAdultTitleCardPair,
};

export const AdultGridNoSlots: Story = {
  name: 'Плитка: 18+ у названия без метаданных',
  args: { hidden: true, withMeta: false },
  play: checkAdultTitleCardPair,
};

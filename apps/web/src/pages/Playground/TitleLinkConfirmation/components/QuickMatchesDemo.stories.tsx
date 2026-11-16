import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { QUICK_CONFIRMATION_MODE, REVIEW_ACTION_LAYOUT } from '../models';
import QuickMatchesDemo from './QuickMatchesDemo';

const META = {
  title: 'Меню/Песочница/Быстрое подтверждение связей',
  component: QuickMatchesDemo,
  args: { mode: QUICK_CONFIRMATION_MODE.DIRECT, isPhone: false },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof QuickMatchesDemo>;

export default META;
type Story = StoryObj<typeof META>;

export const Direct: Story = { name: 'B1 — кнопки под карточкой' };
export const DirectMobile: Story = {
  name: 'B1 — на телефоне',
  args: { isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Menu: Story = {
  name: 'B2 — короткое меню',
  args: { mode: QUICK_CONFIRMATION_MODE.MENU },
  play: async ({ canvasElement }) => {
    const buttons = await within(canvasElement).findAllByRole('button', {
      name: /Проверить связь «/,
    });
    await waitFor(() => expect(buttons[1]!).toBeEnabled());
    await userEvent.click(buttons[1]!);
  },
};

export const MenuMobile: Story = {
  ...Menu,
  name: 'B2 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.MENU, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Review: Story = {
  name: 'B3 — проверка включена',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW },
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole('button', {
      name: /^Проверить связи$/,
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
  },
};

export const ReviewMobile: Story = {
  ...Review,
  name: 'B3 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const ReviewClosed: Story = {
  name: 'B3 — обычная лента',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW },
};
export const List: Story = {
  name: 'B4 — строки списка',
  args: { mode: QUICK_CONFIRMATION_MODE.LIST },
};
export const ListMobile: Story = {
  name: 'B4 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.LIST, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const RegularUser: Story = { name: 'Без прав на подтверждение', args: { isStaff: false } };
export const Empty: Story = { name: 'Нет совпадений', args: { isEmpty: true } };

export const Panel: Story = {
  name: 'B5 — общая панель',
  args: { mode: QUICK_CONFIRMATION_MODE.PANEL },
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole('button', {
      name: /^Выбрать кандидата «Я поднимаю уровень в одиночку»$/,
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
  },
};
export const PanelMobile: Story = {
  ...Panel,
  name: 'B5 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.PANEL, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const Cover: Story = {
  name: 'B6 — действия на обложке',
  args: { mode: QUICK_CONFIRMATION_MODE.COVER },
};
export const CoverMobile: Story = {
  name: 'B6 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.COVER, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const Expand: Story = {
  name: 'B7 — действия раскрыты',
  args: { mode: QUICK_CONFIRMATION_MODE.EXPAND },
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole('button', {
      name: /^Проверить связь «Я поднимаю уровень в одиночку»$/,
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
  },
};
export const ExpandMobile: Story = {
  ...Expand,
  name: 'B7 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.EXPAND, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const Batch: Story = {
  name: 'B8 — выбрано несколько кандидатов',
  args: { mode: QUICK_CONFIRMATION_MODE.BATCH },
  play: async ({ canvasElement }) => {
    for (const name of [
      'Выбрать кандидата «Я поднимаю уровень в одиночку»',
      'Выбрать кандидата «Одиночное повышение уровня»',
    ]) {
      const checkbox = await within(canvasElement).findByRole('checkbox', { name });
      await waitFor(() => expect(checkbox).toBeEnabled());
      await userEvent.click(checkbox);
    }
  },
};
export const BatchMobile: Story = {
  ...Batch,
  name: 'B8 — на телефоне',
  args: { mode: QUICK_CONFIRMATION_MODE.BATCH, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Separate: Story = {
  ...Review,
  name: 'B3a — отдельные кнопки',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.SEPARATE },
};
export const SeparateMobile: Story = {
  ...Separate,
  name: 'B3a — отдельные кнопки — на телефоне',
  args: { ...Separate.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Stacked: Story = {
  ...Review,
  name: 'B3b — кнопки в столбик',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.STACKED },
};
export const StackedMobile: Story = {
  ...Stacked,
  name: 'B3b — кнопки в столбик — на телефоне',
  args: { ...Stacked.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Equal: Story = {
  ...Review,
  name: 'B3c — равнозначные кнопки',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.EQUAL },
};
export const EqualMobile: Story = {
  ...Equal,
  name: 'B3c — равнозначные кнопки — на телефоне',
  args: { ...Equal.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Corners: Story = {
  ...Review,
  name: 'B3d — значки в углах',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.CORNERS },
};
export const CornersMobile: Story = {
  ...Corners,
  name: 'B3d — значки в углах — на телефоне',
  args: { ...Corners.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const CornerMenu: Story = {
  ...Review,
  name: 'B3e — меню на обложке',
  play: async (context) => {
    await Review.play?.(context);
    const button = await within(context.canvasElement).findByRole('button', {
      name: 'Проверить связь «Я поднимаю уровень в одиночку»',
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
  },
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.MENU },
};
export const CornerMenuMobile: Story = {
  ...CornerMenu,
  name: 'B3e — меню на обложке — на телефоне',
  args: { ...CornerMenu.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const Side: Story = {
  ...Review,
  name: 'B3f — действия сбоку',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.SIDE },
};
export const SideMobile: Story = {
  ...Side,
  name: 'B3f — действия сбоку — на телефоне',
  args: { ...Side.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const SideOverlay: Story = {
  ...Review,
  name: 'B3f1 — колонка поверх обложки',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.SIDE_OVERLAY },
};
export const SideOverlayMobile: Story = {
  ...SideOverlay,
  name: 'B3f1 — колонка поверх обложки — на телефоне',
  args: { ...SideOverlay.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const SideInset: Story = {
  ...Review,
  name: 'B3f2 — полоса внутри карточки',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.SIDE_INSET },
};
export const SideInsetMobile: Story = {
  ...SideInset,
  name: 'B3f2 — полоса внутри карточки — на телефоне',
  args: { ...SideInset.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const SidePair: Story = {
  ...Review,
  name: 'B3f3 — пара значков в углу',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.SIDE_PAIR },
};
export const SidePairMobile: Story = {
  ...SidePair,
  name: 'B3f3 — пара значков в углу — на телефоне',
  args: { ...SidePair.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const StackOverlay: Story = {
  ...Review,
  name: 'B3b1 — кнопки поверх обложки',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.STACK_OVERLAY },
};
export const StackOverlayMobile: Story = {
  ...StackOverlay,
  name: 'B3b1 — кнопки поверх обложки — на телефоне',
  args: { ...StackOverlay.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const StackCrop: Story = {
  ...Review,
  name: 'B3b2 — обрезка обложки',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.STACK_CROP },
};
export const StackCropMobile: Story = {
  ...StackCrop,
  name: 'B3b2 — обрезка обложки — на телефоне',
  args: { ...StackCrop.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

export const StackFit: Story = {
  ...Review,
  name: 'B3b3 — уменьшенная обложка',
  args: { mode: QUICK_CONFIRMATION_MODE.REVIEW, actionLayout: REVIEW_ACTION_LAYOUT.STACK_FIT },
};
export const StackFitMobile: Story = {
  ...StackFit,
  name: 'B3b3 — уменьшенная обложка — на телефоне',
  args: { ...StackFit.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};

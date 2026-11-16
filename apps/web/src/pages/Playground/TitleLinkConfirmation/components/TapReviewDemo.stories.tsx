import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { BATCH_REVIEW_PRESENTATION, TAP_REVIEW_MODE } from '../models';
import TapReviewDemo from './TapReviewDemo';

const META = {
  title: 'Меню/Песочница/Проверка связей нажатием',
  component: TapReviewDemo,
  args: { mode: TAP_REVIEW_MODE.MENU, isPhone: false },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TapReviewDemo>;

export default META;
type Story = StoryObj<typeof META>;

export const MenuClosed: Story = { name: 'B9 — обычная лента' };
export const Menu: Story = {
  name: 'B9 — меню открыто',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const start = await canvas.findByRole('button', { name: 'Проверить связи' });
    await waitFor(() => expect(start).toBeEnabled());
    await userEvent.click(start);
    const card = await canvas.findByRole('button', {
      name: 'Проверить связь «Я поднимаю уровень в одиночку»',
    });
    await waitFor(() => expect(card).toBeEnabled());
    await userEvent.click(card);
  },
};
export const MenuMobile: Story = {
  ...Menu,
  name: 'B9 — на телефоне',
  args: { isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const HeaderClosed: Story = {
  name: 'B10 — обычная лента',
  args: { mode: TAP_REVIEW_MODE.HEADER },
};
export const HeaderUnselected: Story = {
  name: 'B10 — кандидат не выбран',
  args: { mode: TAP_REVIEW_MODE.HEADER },
  play: async ({ canvasElement }) => {
    const start = await within(canvasElement).findByRole('button', {
      name: 'Проверить связи',
    });
    await waitFor(() => expect(start).toBeEnabled());
    await userEvent.click(start);
  },
};
export const Header: Story = {
  ...HeaderUnselected,
  name: 'B10 — кандидат выбран',
  play: async (context) => {
    await HeaderUnselected.play?.(context);
    const card = await within(context.canvasElement).findByRole('button', {
      name: 'Выбрать кандидата «Я поднимаю уровень в одиночку»',
    });
    await waitFor(() => expect(card).toBeEnabled());
    await userEvent.click(card);
  },
};
export const HeaderMobile: Story = {
  ...Header,
  name: 'B10 — на телефоне',
  args: { mode: TAP_REVIEW_MODE.HEADER, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const RegularUser: Story = { name: 'Без прав на подтверждение', args: { isStaff: false } };
export const Empty: Story = { name: 'Нет кандидатов', args: { isEmpty: true } };

export const BatchClosed: Story = {
  name: 'B11 — обычная лента',
  args: { mode: TAP_REVIEW_MODE.BATCH },
};
export const BatchEmptySelection: Story = {
  ...HeaderUnselected,
  name: 'B11 — выбор пуст',
  args: { mode: TAP_REVIEW_MODE.BATCH },
};
export const Batch: Story = {
  ...BatchEmptySelection,
  name: 'B11 — выбрано несколько связей',
  play: async (context) => {
    await BatchEmptySelection.play?.(context);
    const canvas = within(context.canvasElement);
    for (const title of ['Я поднимаю уровень в одиночку', 'Одиночное повышение уровня']) {
      const card = await canvas.findByRole('checkbox', { name: `Выбрать кандидата «${title}»` });
      await waitFor(() => expect(card).toBeEnabled());
      await userEvent.click(card);
    }
  },
};
export const BatchMobile: Story = {
  ...Batch,
  name: 'B11 — на телефоне',
  args: { mode: TAP_REVIEW_MODE.BATCH, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const BatchRegularUser: Story = {
  name: 'B11 — без прав на подтверждение',
  args: { mode: TAP_REVIEW_MODE.BATCH, isStaff: false },
};
export const BatchEmpty: Story = {
  name: 'B11 — нет кандидатов',
  args: { mode: TAP_REVIEW_MODE.BATCH, isEmpty: true },
};

export const RefinedBatch: Story = {
  ...Batch,
  name: 'B11a — цветные действия справа',
  args: { mode: TAP_REVIEW_MODE.BATCH, refinedBatchActions: true },
};
export const RefinedBatchMobile: Story = {
  ...RefinedBatch,
  name: 'B11a — на телефоне',
  args: { ...RefinedBatch.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const RefinedBatchEmptySelection: Story = {
  ...BatchEmptySelection,
  name: 'B11a — выбор пуст',
  args: { mode: TAP_REVIEW_MODE.BATCH, refinedBatchActions: true },
};

export const DividedBatch: Story = {
  ...Batch,
  name: 'B11b — разделитель',
  args: {
    mode: TAP_REVIEW_MODE.BATCH,
    refinedBatchActions: true,
    batchPresentation: BATCH_REVIEW_PRESENTATION.DIVIDER,
  },
};
export const DividedBatchMobile: Story = {
  ...DividedBatch,
  name: 'B11b — на телефоне',
  args: { ...DividedBatch.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const DividedBatchEmptySelection: Story = {
  ...BatchEmptySelection,
  name: 'B11b — выбор пуст',
  args: { ...DividedBatch.args },
};

export const PanelBatch: Story = {
  ...Batch,
  name: 'B11c — панель действий',
  args: {
    mode: TAP_REVIEW_MODE.BATCH,
    refinedBatchActions: true,
    batchPresentation: BATCH_REVIEW_PRESENTATION.PANEL,
  },
};
export const PanelBatchMobile: Story = {
  ...PanelBatch,
  name: 'B11c — на телефоне',
  args: { ...PanelBatch.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const PanelBatchEmptySelection: Story = {
  ...BatchEmptySelection,
  name: 'B11c — выбор пуст',
  args: { ...PanelBatch.args },
};

export const FramedBatch: Story = {
  ...Batch,
  name: 'B11d — рамка режима',
  args: {
    mode: TAP_REVIEW_MODE.BATCH,
    refinedBatchActions: true,
    batchPresentation: BATCH_REVIEW_PRESENTATION.FRAME,
  },
};
export const FramedBatchMobile: Story = {
  ...FramedBatch,
  name: 'B11d — на телефоне',
  args: { ...FramedBatch.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const FramedBatchEmptySelection: Story = {
  ...BatchEmptySelection,
  name: 'B11d — выбор пуст',
  args: { ...FramedBatch.args },
};

export const FinalBatch: Story = {
  ...DividedBatch,
  name: 'Итог B11b — есть выбор',
  args: { ...DividedBatch.args, hideUnselectedBatchActions: true },
};
export const FinalBatchMobile: Story = {
  ...FinalBatch,
  name: 'Итог B11b — на телефоне',
  args: { ...FinalBatch.args, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const FinalBatchEmptySelection: Story = {
  ...DividedBatchEmptySelection,
  name: 'Итог B11b — выбор пуст',
  args: { ...FinalBatch.args },
};
export const FinalBatchClosed: Story = {
  name: 'Итог B11b — обычная лента',
  args: { ...FinalBatch.args },
};

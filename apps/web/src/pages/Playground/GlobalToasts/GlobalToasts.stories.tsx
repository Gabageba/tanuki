import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import PlaygroundGlobalToasts from '.';

const ROUTE: StoryRoute = {
  path: `${ROUTE_PATHS.PLAYGROUND}/*`,
  url: `${ROUTE_PATHS.PLAYGROUND}/global-toasts`,
  layout: STORY_LAYOUT.PLAYGROUND,
};
const META = {
  title: 'Страницы/Песочница/Общие тосты проекта',
  component: PlaygroundGlobalToasts,
  parameters: { route: ROUTE },
} satisfies Meta<typeof PlaygroundGlobalToasts>;
export default META;
type Story = StoryObj<typeof META>;
export const Default: Story = { name: 'Обычная' };
export const Mobile: Story = { name: 'На телефоне', globals: MOBILE_GLOBALS };
export const ModalOverlay: Story = {
  name: 'Ошибка поверх модалки',
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Открыть модалку' });
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(within(document.body).getByRole('dialog')).toBeVisible();
  },
};
export const DrawerOverlay: Story = {
  name: 'Ошибка поверх drawer',
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Открыть drawer' });
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(within(document.body).getByRole('dialog')).toBeVisible();
  },
};

export const FinalCombination: Story = {
  name: 'Выбранная комбинация',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D5a + T5 + C1', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};

export const ActionRevisions: Story = {
  name: 'Новые варианты кнопок',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D3', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};
export const AlignmentRevisions: Story = {
  name: 'Новые варианты выравнивания',
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: 'Выравнивание заголовка' });
    heading.scrollIntoView({ block: 'start' });
    await expect(heading).toBeVisible();
  },
};

export const CompactFooterResult: Story = {
  name: 'Итог с кнопкой 30 px',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D5a + T5 + C1', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};
export const DenseFooterResult: Story = {
  name: 'Итог с кнопкой 26 px',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D5b + T5 + C1', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};

export const NativeCompactXs: Story = {
  name: 'Итог с Mantine compact-xs',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D5c + T5 + C1', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};
export const NativeCompactSm: Story = {
  name: 'Итог с Mantine compact-sm',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D5d + T5 + C1', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};
export const NativeCompactMd: Story = {
  name: 'Итог с Mantine compact-md',
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('D5e + T5 + C1', { exact: true });
    badge.scrollIntoView({ block: 'start' });
    await expect(badge).toBeVisible();
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import PlaygroundEmailLayout from '.';

const ROUTE: StoryRoute = {
  path: `${ROUTE_PATHS.PLAYGROUND}/*`,
  url: `${ROUTE_PATHS.PLAYGROUND}/email-layout`,
  layout: STORY_LAYOUT.PLAYGROUND,
};
const META = {
  title: 'Страницы/Песочница/Письма Tanuki',
  component: PlaygroundEmailLayout,
  parameters: { route: ROUTE },
} satisfies Meta<typeof PlaygroundEmailLayout>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Обычная' };
export const Mobile: Story = { name: 'На телефоне', globals: MOBILE_GLOBALS };
export const CompactAction: Story = {
  name: 'E1a · кнопка 36 px',
  play: async ({ canvasElement }) => {
    const variant = within(canvasElement).getByText('E1a', {
      exact: true,
      selector: '#variant-E1a *',
    });
    variant.scrollIntoView({ block: 'start' });
    await expect(variant).toBeVisible();
  },
};
export const LargeAction: Story = {
  name: 'E1b · кнопка 44 px',
  play: async ({ canvasElement }) => {
    const variant = within(canvasElement).getByText('E1b', {
      exact: true,
      selector: '#variant-E1b *',
    });
    variant.scrollIntoView({ block: 'start' });
    await expect(variant).toBeVisible();
  },
};
export const DarkEmails: Story = {
  name: 'Тёмная адаптация писем',
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('combobox', { name: 'Тема макетов писем' }),
    );
    await userEvent.click(within(document.body).getByRole('option', { name: 'Тёмная адаптация' }));
  },
};
export const SystemFonts: Story = {
  name: 'Без фирменных шрифтов',
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('checkbox', { name: 'Показать фирменные шрифты' }),
    );
  },
};

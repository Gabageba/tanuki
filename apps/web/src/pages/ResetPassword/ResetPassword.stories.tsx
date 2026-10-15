import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import ResetPassword from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.RESET_PASSWORD,
  url: `${ROUTE_PATHS.RESET_PASSWORD}?token=storybook`,
  layout: STORY_LAYOUT.AUTH,
};

const META = {
  title: 'Страницы входа/Новый пароль',
  render: () => <ResetPassword />,
  parameters: { route: ROUTE },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Обычная',
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

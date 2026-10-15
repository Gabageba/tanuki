import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS, MANAGEMENT_INVITES_PATH } from '@/shared/lib/routes';
import { ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Management from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.MANAGEMENT,
  url: ROUTE_PATHS.MANAGEMENT,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Управление',
  render: () => <Management />,
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

export const Loading: Story = {
  name: 'Загрузка',
  parameters: { msw: LOADING_HANDLERS },
};

export const ServerError: Story = {
  name: 'Ошибка сервера',
  parameters: { msw: ERROR_HANDLERS },
};

export const Invites: Story = {
  name: 'Приглашения',
  parameters: { route: { ...ROUTE, url: MANAGEMENT_INVITES_PATH } },
};

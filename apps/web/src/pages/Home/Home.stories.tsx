import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Home from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.HOME,
  url: ROUTE_PATHS.HOME,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Главная',
  render: () => <Home />,
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

export const Empty: Story = {
  name: 'Первый вход: читать нечего',
  parameters: {
    msw: [
      http.get(apiPath('/reading-progress/recent'), () => HttpResponse.json({ items: [] })),
      http.get(apiPath('/bookmarks/new-chapters'), () => HttpResponse.json({ items: [] })),
    ],
  },
};

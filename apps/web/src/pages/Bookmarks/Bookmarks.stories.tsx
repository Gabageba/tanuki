import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Bookmarks from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.BOOKMARKS,
  url: ROUTE_PATHS.BOOKMARKS,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Закладки',
  render: () => <Bookmarks />,
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
  name: 'Пустая папка',
  parameters: {
    msw: [
      http.get(apiPath('/bookmarks'), () => HttpResponse.json({ items: [], page: 1, total: 0 })),
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Notifications from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.NOTIFICATIONS,
  url: ROUTE_PATHS.NOTIFICATIONS,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Уведомления',
  render: () => <Notifications />,
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
  name: 'Пустая лента',
  parameters: {
    msw: [
      http.get(apiPath('/notifications'), () =>
        HttpResponse.json({ items: [], page: 1, total: 0 }),
      ),
      http.get(apiPath('/notifications/unread-count'), () => HttpResponse.json({ count: 0 })),
    ],
  },
};

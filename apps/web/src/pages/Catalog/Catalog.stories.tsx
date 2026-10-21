import type { Meta, StoryObj } from '@storybook/react-vite';
import { onlineManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Catalog from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.CATALOG,
  url: generatePath(ROUTE_PATHS.CATALOG, { sourceId: 'readmanga_ru' }),
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Каталог',
  render: () => <Catalog />,
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
  name: 'Пусто',
  parameters: {
    msw: [
      http.get(apiPath('/sources/:sourceId/titles'), () =>
        HttpResponse.json({ items: [], page: 1, hasNext: false }),
      ),
    ],
  },
};

export const Offline: Story = {
  name: 'Нет соединения',
  beforeEach: () => {
    onlineManager.setOnline(false);
    return () => onlineManager.setOnline(true);
  },
};

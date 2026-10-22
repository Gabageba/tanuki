import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { SOURCES_RESPONSE } from '@/shared/storybook/fixtures';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Selections from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.SELECTIONS,
  url: ROUTE_PATHS.SELECTIONS,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Подборки',
  render: () => <Selections />,
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
  name: 'Нет источников с подборками',
  parameters: {
    msw: [
      http.get(apiPath('/sources'), () =>
        HttpResponse.json(
          Object.fromEntries(
            Object.entries(SOURCES_RESPONSE).map(([type, sources]) => [
              type,
              sources.map((source) => ({ ...source, homeSections: [] })),
            ]),
          ),
        ),
      ),
    ],
  },
};

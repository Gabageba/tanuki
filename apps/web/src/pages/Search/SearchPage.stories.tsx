import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import { SEARCH_RESPONSE } from '@/shared/storybook/titles';
import SearchPage from './SearchPage';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.SEARCH,
  url: `${ROUTE_PATHS.SEARCH}?query=берсерк`,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Поиск',
  render: () => <SearchPage />,
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
  name: 'Ничего не найдено',
  parameters: {
    msw: [
      http.get(apiPath('/search'), () =>
        HttpResponse.json({
          groups: SEARCH_RESPONSE.groups.map((group) => ({
            ...group,
            status: SEARCH_GROUP_STATUS.OK,
            items: [],
          })),
        }),
      ),
    ],
  },
};

export const NoQuery: Story = {
  name: 'Без запроса',
  parameters: { route: { ...ROUTE, url: ROUTE_PATHS.SEARCH } },
};

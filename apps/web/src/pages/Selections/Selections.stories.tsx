import { expect, waitFor } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
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

const POPULAR_ROUTE: StoryRoute = {
  ...ROUTE,
  url: `${ROUTE_PATHS.SELECTIONS}?source=nudemoon&section=popular&variant=2026-11&order=likes`,
};

export const Popular: Story = {
  name: 'Популярные Nude-Moon',
  parameters: { route: POPULAR_ROUTE },
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(canvasElement.querySelectorAll('[data-view-mode="coverless"]')).toHaveLength(12);
    });
  },
};

export const PopularMobile: Story = {
  ...Popular,
  name: 'Популярные на телефоне',
  globals: MOBILE_GLOBALS,
};

export const PopularLoading: Story = {
  ...Popular,
  name: 'Популярные: загрузка блока',
  play: undefined,
  parameters: {
    route: POPULAR_ROUTE,
    msw: [
      http.get(apiPath('/selections/nudemoon/popular'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    ],
  },
};

export const PopularEmpty: Story = {
  ...Popular,
  name: 'Популярные: пустой месяц',
  play: undefined,
  parameters: {
    route: POPULAR_ROUTE,
    msw: [
      http.get(apiPath('/selections/nudemoon/popular'), () =>
        HttpResponse.json({
          sourceId: 'nudemoon',
          sectionId: 'popular',
          status: SEARCH_GROUP_STATUS.OK,
          items: [],
          hasNextPage: false,
        }),
      ),
    ],
  },
};

export const PopularError: Story = {
  ...Popular,
  name: 'Популярные: ошибка запроса блока',
  play: undefined,
  parameters: {
    route: POPULAR_ROUTE,
    msw: [
      http.get(apiPath('/selections/nudemoon/popular'), () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    ],
  },
};

export const PopularUnavailable: Story = {
  ...Popular,
  name: 'Популярные: источник не ответил',
  play: undefined,
  parameters: {
    route: POPULAR_ROUTE,
    msw: [
      http.get(apiPath('/selections/nudemoon/popular'), () =>
        HttpResponse.json({
          sourceId: 'nudemoon',
          sectionId: 'popular',
          status: SEARCH_GROUP_STATUS.UNAVAILABLE,
          items: [],
          hasNextPage: false,
        }),
      ),
    ],
  },
};

export const PopularStaleMonth: Story = {
  ...Popular,
  name: 'Популярные: устаревший месяц в адресе',
  parameters: {
    route: {
      ...POPULAR_ROUTE,
      url: `${ROUTE_PATHS.SELECTIONS}?source=nudemoon&section=popular&variant=2025-01&order=rating`,
    },
  },
};

export const PopularLocked: Story = {
  ...Popular,
  name: 'Популярные: нужен вход на источник',
  play: undefined,
  parameters: {
    route: POPULAR_ROUTE,
    msw: [
      http.get(apiPath('/selections/nudemoon/popular'), () =>
        HttpResponse.json({
          sourceId: 'nudemoon',
          sectionId: 'popular',
          status: SEARCH_GROUP_STATUS.LOCKED,
          items: [],
          hasNextPage: false,
        }),
      ),
    ],
  },
};

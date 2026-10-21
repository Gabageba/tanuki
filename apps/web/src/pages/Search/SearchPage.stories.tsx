import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { userEvent, within } from 'storybook/test';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  apiPath,
  ERROR_HANDLERS,
  LOADING_HANDLERS,
  neverResolve,
  searchStream,
} from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import { SEARCH_GROUPS } from '@/shared/storybook/titles';
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
        searchStream(
          SEARCH_GROUPS.map((group) => ({ ...group, status: SEARCH_GROUP_STATUS.OK, items: [] })),
        ),
      ),
    ],
  },
};

export const Streaming: Story = {
  name: 'Идёт поиск',
  parameters: {
    msw: [
      // Ответил первый источник; второй и Remanga ещё ищут — их места скелетоном.
      http.get(apiPath('/search'), () =>
        searchStream(SEARCH_GROUPS.slice(0, 1), { pendingIds: ['mintmanga', 'remanga'] }),
      ),
    ],
  },
};

export const Retry: Story = {
  name: 'Повтор',
  parameters: {
    msw: [
      // Повтор по не ответившим висит: их места снова скелетоном, найденное остаётся.
      http.get(apiPath('/search'), ({ request }) =>
        new URL(request.url).searchParams.has('retry')
          ? neverResolve()
          : searchStream(SEARCH_GROUPS),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: I18N.t('retry') }),
    );
  },
};

export const NoQuery: Story = {
  name: 'Без запроса',
  parameters: { route: { ...ROUTE, url: ROUTE_PATHS.SEARCH } },
};

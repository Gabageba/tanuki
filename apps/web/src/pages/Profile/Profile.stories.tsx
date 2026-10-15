import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ROUTE_PATHS, PROFILE_TAB_SEARCH_PARAM, PROFILE_TABS } from '@/shared/lib/routes';
import { EMPTY_PROFILE_STATISTICS_RESPONSE } from '@/shared/storybook/account';
import { apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Profile from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.PROFILE,
  url: ROUTE_PATHS.PROFILE,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Профиль',
  render: () => <Profile />,
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
  name: 'Статистика: ещё не читали',
  parameters: {
    msw: [
      http.get(apiPath('/users/me/statistics'), () =>
        HttpResponse.json(EMPTY_PROFILE_STATISTICS_RESPONSE),
      ),
    ],
  },
};

export const SignInAndSecurity: Story = {
  name: 'Вход и безопасность',
  parameters: {
    route: {
      ...ROUTE,
      url: `${ROUTE.url}?${PROFILE_TAB_SEARCH_PARAM}=${PROFILE_TABS.SIGN_IN_AND_SECURITY}`,
    },
  },
};

export const SourceAccounts: Story = {
  name: 'Аккаунты источников',
  parameters: {
    route: {
      ...ROUTE,
      url: `${ROUTE.url}?${PROFILE_TAB_SEARCH_PARAM}=${PROFILE_TABS.SOURCE_ACCOUNTS}`,
    },
  },
};

export const Data: Story = {
  name: 'Данные',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?${PROFILE_TAB_SEARCH_PARAM}=${PROFILE_TABS.DATA}` },
  },
};

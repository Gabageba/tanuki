import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ROUTE_PATHS, PROFILE_TAB_SEARCH_PARAM, PROFILE_TABS } from '@/shared/lib/routes';
import { EMPTY_PROFILE_STATISTICS_RESPONSE } from '@/shared/storybook/account';
import {
  EMPTY_SOURCE_ACCOUNTS_RESPONSE,
  EXPIRED_SESSION_SOURCES_RESPONSE,
  EXPIRED_SOURCE_ACCOUNTS_RESPONSE,
  SOURCES_RESPONSE,
  UNLINKED_SOURCES_RESPONSE,
} from '@/shared/storybook/fixtures';
import { apiError, apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
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

export const SourceAccountsMobile: Story = {
  ...SourceAccounts,
  name: 'Аккаунты источников: на телефоне',
  globals: MOBILE_GLOBALS,
};

export const SourceAccountsLoading: Story = {
  ...SourceAccounts,
  name: 'Аккаунты источников: загрузка',
  parameters: { ...SourceAccounts.parameters, msw: LOADING_HANDLERS },
};

export const SourceAccountsUnlinked: Story = {
  ...SourceAccounts,
  name: 'Аккаунты источников: нет привязанных аккаунтов',
  parameters: {
    ...SourceAccounts.parameters,
    msw: [
      http.get(apiPath('/source-accounts'), () =>
        HttpResponse.json(EMPTY_SOURCE_ACCOUNTS_RESPONSE),
      ),
      http.get(apiPath('/sources'), () => HttpResponse.json(UNLINKED_SOURCES_RESPONSE)),
    ],
  },
};

export const SourceAccountsExpiredSessions: Story = {
  ...SourceAccounts,
  name: 'Аккаунты источников: истёкшие сессии',
  parameters: {
    ...SourceAccounts.parameters,
    msw: [
      http.get(apiPath('/source-accounts'), () =>
        HttpResponse.json(EXPIRED_SOURCE_ACCOUNTS_RESPONSE),
      ),
      http.get(apiPath('/sources'), () => HttpResponse.json(EXPIRED_SESSION_SOURCES_RESPONSE)),
    ],
  },
};

export const SourceAccountsExpiredSessionsMobile: Story = {
  ...SourceAccountsExpiredSessions,
  name: 'Аккаунты источников: истёкшие сессии на телефоне',
  globals: MOBILE_GLOBALS,
};

export const SourceAccountsLinkingUnavailable: Story = {
  ...SourceAccountsUnlinked,
  name: 'Аккаунты источников: привязка не настроена',
  parameters: {
    ...SourceAccountsUnlinked.parameters,
    msw: [
      http.get(apiPath('/source-accounts'), () =>
        HttpResponse.json({ ...EMPTY_SOURCE_ACCOUNTS_RESPONSE, isLinkingAvailable: false }),
      ),
      http.get(apiPath('/sources'), () => HttpResponse.json(UNLINKED_SOURCES_RESPONSE)),
    ],
  },
};

export const SourceAccountsServerError: Story = {
  ...SourceAccounts,
  name: 'Аккаунты источников: ошибка загрузки аккаунтов',
  parameters: {
    ...SourceAccounts.parameters,
    msw: [
      http.get(apiPath('/source-accounts'), () =>
        apiError(API_ERROR_CODE.INTERNAL, 'Не удалось загрузить аккаунты источников', 500),
      ),
      http.get(apiPath('/sources'), () => HttpResponse.json(UNLINKED_SOURCES_RESPONSE)),
    ],
  },
};

export const SourceAccountsCustomOrder: Story = {
  ...SourceAccounts,
  name: 'Аккаунты источников: источники группы в начале и конце',
  parameters: {
    ...SourceAccounts.parameters,
    msw: [
      http.get(apiPath('/sources'), () =>
        HttpResponse.json(
          Object.fromEntries(
            Object.entries(SOURCES_RESPONSE).map(([contentType, sources]) => [
              contentType,
              sources.map((source) => ({
                ...source,
                position:
                  source.id === 'mangalib'
                    ? -2
                    : source.id === 'desume'
                      ? -1
                      : source.id === 'hentailib'
                        ? 1000
                        : source.position,
              })),
            ]),
          ),
        ),
      ),
    ],
  },
};

export const Data: Story = {
  name: 'Данные',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?${PROFILE_TAB_SEARCH_PARAM}=${PROFILE_TABS.DATA}` },
  },
};

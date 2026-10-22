import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';
import { screen, userEvent } from 'storybook/test';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { ROUTE_PATHS, TITLE_TAB_SEARCH_PARAM, TITLE_TABS } from '@/shared/lib/routes';
import { apiError, apiPath, ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import { LINKED_READING_PROGRESS_RESPONSE, TITLE } from '@/shared/storybook/titles';
import Title from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.TITLE,
  url: generatePath(ROUTE_PATHS.TITLE, { titleId: TITLE.id }),
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Тайтл',
  render: () => <Title />,
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

export const Chapters: Story = {
  name: 'Вкладка «Главы»',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?${TITLE_TAB_SEARCH_PARAM}=${TITLE_TABS.CHAPTERS}` },
  },
};

export const NotFound: Story = {
  name: 'Тайтл не найден',
  parameters: {
    msw: [
      http.get(apiPath('/titles/:titleId'), () =>
        apiError(API_ERROR_CODE.NOT_FOUND, 'Тайтл не найден на источнике', 404),
      ),
    ],
  },
};

export const LinkedProgress: Story = {
  name: 'Отметка на другом источнике',
  play: async () =>
    userEvent.click(await screen.findByRole('button', { name: I18N.t('continueFromOtherSource') })),
  parameters: {
    msw: [
      http.get(apiPath('/titles/:titleId/progress'), () =>
        HttpResponse.json(LINKED_READING_PROGRESS_RESPONSE),
      ),
    ],
  },
};

export const NotRead: Story = {
  name: 'Ещё не читали, не в закладках',
  parameters: {
    msw: [
      http.get(apiPath('/titles/:titleId/progress'), () =>
        HttpResponse.json({ own: null, linked: [] }),
      ),
      http.get(apiPath('/titles/:titleId/bookmark'), () =>
        HttpResponse.json({ folderId: null, conflict: null }),
      ),
    ],
  },
};

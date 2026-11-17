import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import { BOOKMARKS_RESPONSE } from '@/shared/storybook/account';
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
  // Папки и карточки грузятся последовательно: finished без play ещё не означает готовый список.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: BOOKMARKS_RESPONSE.items[0]!.name }),
    ).toBeVisible();
  },
};

export const Mobile: Story = {
  ...Default,
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

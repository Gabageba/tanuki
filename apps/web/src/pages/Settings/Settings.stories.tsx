import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS, SETTINGS_TAB_SEARCH_PARAM, SETTINGS_TABS } from '@/shared/lib/routes';
import { DOWNLOADS_SEED } from '@/shared/storybook/downloads';
import { ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Settings from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.SETTINGS,
  url: ROUTE_PATHS.SETTINGS,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Настройки',
  render: () => <Settings />,
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

export const SourcesTab: Story = {
  name: 'Источники',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.SOURCES}` },
  },
};

export const ReaderTab: Story = {
  name: 'Читалка',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.READER}` },
  },
};

export const BookmarksTab: Story = {
  name: 'Закладки',
  parameters: {
    route: {
      ...ROUTE,
      url: `${ROUTE.url}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.BOOKMARKS}`,
    },
  },
};

export const NotificationsTab: Story = {
  name: 'Уведомления',
  parameters: {
    route: {
      ...ROUTE,
      url: `${ROUTE.url}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.NOTIFICATIONS}`,
    },
  },
};

export const SelectionsTab: Story = {
  name: 'Подборки',
  parameters: {
    route: {
      ...ROUTE,
      url: `${ROUTE.url}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.SELECTIONS}`,
    },
  },
};

export const DownloadsTab: Story = {
  name: 'Загрузки',
  parameters: {
    route: {
      ...ROUTE,
      url: `${ROUTE.url}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.DOWNLOADS}`,
    },
    offlineDb: DOWNLOADS_SEED,
  },
};

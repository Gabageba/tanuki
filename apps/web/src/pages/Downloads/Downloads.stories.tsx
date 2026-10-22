import type { Meta, StoryObj } from '@storybook/react-vite';
import { DOWNLOAD_STATUS } from '@/entities/download/models';
import { DOWNLOADS_TABS, getDownloadsPath, ROUTE_PATHS } from '@/shared/lib/routes';
import {
  DOWNLOADED_SEED,
  DOWNLOADS_PAUSED_SEED,
  DOWNLOADS_QUOTA_SEED,
  DOWNLOADS_SEED,
} from '@/shared/storybook/downloads';
import { OFFLINE_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import { goOffline } from '@/shared/storybook/network';
import { TITLE } from '@/shared/storybook/titles';
import Downloads from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.DOWNLOADS,
  url: ROUTE_PATHS.DOWNLOADS,
  layout: STORY_LAYOUT.APP,
};

const DOWNLOADED_ROUTE: StoryRoute = {
  ...ROUTE,
  url: getDownloadsPath(DOWNLOADS_TABS.DOWNLOADED),
};

// Данные страницы — локальная база, а не API: ни загрузки, ни ошибки сервера у неё нет.
const META = {
  title: 'Страницы/Загрузки',
  render: () => <Downloads />,
  parameters: { route: ROUTE },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Обычная',
  parameters: { offlineDb: DOWNLOADS_SEED },
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
  parameters: { offlineDb: DOWNLOADS_SEED },
};

export const Empty: Story = {
  name: 'Пусто',
};

export const Paused: Story = {
  name: 'Очередь на паузе',
  parameters: { offlineDb: DOWNLOADS_PAUSED_SEED },
};

export const OutOfSpace: Story = {
  name: 'Кончилось место',
  parameters: { offlineDb: DOWNLOADS_QUOTA_SEED },
};

export const QueueEmpty: Story = {
  name: 'Очередь пуста',
  parameters: {
    route: { ...ROUTE, url: getDownloadsPath(DOWNLOADS_TABS.QUEUE) },
    offlineDb: DOWNLOADED_SEED,
  },
};

export const Downloaded: Story = {
  name: 'Вкладка «Скачанное»',
  parameters: { route: DOWNLOADED_ROUTE, offlineDb: DOWNLOADS_SEED },
};

export const DownloadedTitle: Story = {
  name: 'Скачанное, раскрыт тайтл',
  parameters: {
    route: { ...ROUTE, url: getDownloadsPath(DOWNLOADS_TABS.DOWNLOADED, TITLE.id) },
    offlineDb: DOWNLOADS_SEED,
  },
};

export const NothingDownloaded: Story = {
  name: 'Скачанного нет',
  parameters: {
    route: DOWNLOADED_ROUTE,
    offlineDb: {
      ...DOWNLOADS_SEED,
      downloads: DOWNLOADS_SEED.downloads.filter((row) => row.status !== DOWNLOAD_STATUS.DONE),
    },
  },
};

export const Offline: Story = {
  name: 'Без сети',
  beforeEach: goOffline,
  parameters: { offlineDb: DOWNLOADED_SEED, msw: OFFLINE_HANDLERS },
};

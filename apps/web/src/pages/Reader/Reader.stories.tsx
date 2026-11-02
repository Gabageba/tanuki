import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';
import {
  DEFAULT_READER_SETTINGS,
  READER_DIRECTION,
  READER_PAGE_LAYOUT,
  READER_READING_MODE,
  READER_PAGE_FIT,
} from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  apiPath,
  ERROR_HANDLERS,
  LOADING_HANDLERS,
  neverResolve,
  OFFLINE_HANDLERS,
} from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import { goOffline } from '@/shared/storybook/network';
import { READING_CHAPTER, TITLE } from '@/shared/storybook/titles';
import Reader from '.';
import {
  getReaderSettingsHandler,
  getReaderPagesHandler,
  READER_OFFLINE_SEED,
} from '@/shared/storybook/reader';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.READER,
  url: generatePath(ROUTE_PATHS.READER, { titleId: TITLE.id, chapterId: READING_CHAPTER.id }),
  layout: STORY_LAYOUT.NONE,
};

const META = {
  title: 'Страницы/Читалка',
  render: () => <Reader />,
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

export const ChapterNotDownloaded: Story = {
  name: 'Без сети, глава не скачана',
  beforeEach: goOffline,
  parameters: {
    msw: [
      // Настройки читалки без сети отдаёт кеш воркера.
      http.get(apiPath('/reader-settings'), () => HttpResponse.json(DEFAULT_READER_SETTINGS)),
      ...OFFLINE_HANDLERS,
    ],
  },
};

const PAGED = { readingMode: READER_READING_MODE.HORIZONTAL, pageFit: READER_PAGE_FIT.FIT_HEIGHT };
const SPREAD = { ...PAGED, pageLayout: READER_PAGE_LAYOUT.SPREAD };

export const LoadingHorizontal: Story = {
  name: 'Загрузка разворота',
  parameters: {
    msw: [
      getReaderSettingsHandler(SPREAD),
      http.get(apiPath('/titles/:titleId/chapters/:chapterId/pages'), neverResolve),
    ],
  },
};

export const LoadingMobile: Story = {
  ...LoadingHorizontal,
  name: 'Загрузка на телефоне',
  globals: MOBILE_GLOBALS,
};

export const Horizontal: Story = {
  name: 'Постраничный режим',
  parameters: { msw: [getReaderSettingsHandler(PAGED)] },
};
export const RtlSpread: Story = {
  name: 'Разворот справа налево',
  parameters: { msw: [getReaderSettingsHandler({ ...SPREAD, direction: READER_DIRECTION.RTL })] },
};
export const MobileSpread: Story = {
  name: 'Разворот на телефоне',
  globals: MOBILE_GLOBALS,
  parameters: { msw: [getReaderSettingsHandler(SPREAD)] },
};
export const MixedSpread: Story = {
  name: 'Страницы разной высоты',
  parameters: { msw: [getReaderSettingsHandler(SPREAD), getReaderPagesHandler(5, false, true)] },
};
export const OddLastPage: Story = {
  name: 'Последняя непарная страница',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?page=5` },
    msw: [getReaderSettingsHandler(SPREAD), getReaderPagesHandler(5)],
  },
};
export const LongChapter: Story = {
  name: 'Длинная глава — 200 страниц',
  parameters: { msw: [getReaderPagesHandler(200)] },
};
export const NoPrefetch: Story = {
  name: 'Предзагрузка выключена',
  parameters: {
    msw: [
      getReaderSettingsHandler({ prefetchPages: 0, autoNextChapter: false }),
      getReaderPagesHandler(200),
    ],
  },
};
export const ResumeLongChapter: Story = {
  name: 'Продолжение со страницы 151',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?page=151` },
    msw: [getReaderPagesHandler(200)],
  },
};
export const UnknownSizes: Story = {
  name: 'Неизвестные размеры страниц',
  parameters: {
    route: { ...ROUTE, url: `${ROUTE.url}?page=151` },
    msw: [getReaderPagesHandler(200, true, true)],
  },
};
export const DimmedPages: Story = {
  name: 'Яркость страниц 60%',
  parameters: {
    msw: [getReaderSettingsHandler({ ...SPREAD, brightness: 60 })],
  },
};
export const Empty: Story = {
  name: 'Пусто',
  parameters: { msw: [getReaderPagesHandler(0)] },
};
export const ImageError: Story = {
  name: 'Ошибка изображения',
  parameters: {
    msw: [getReaderSettingsHandler(PAGED), http.get(apiPath('/img'), () => HttpResponse.error())],
  },
};

export const DownloadedOffline: Story = {
  name: 'Без сети — скачанная глава',
  beforeEach: goOffline,
  parameters: {
    offlineDb: READER_OFFLINE_SEED,
    msw: [getReaderSettingsHandler({ ...SPREAD, prefetchPages: 10 }), ...OFFLINE_HANDLERS],
  },
};

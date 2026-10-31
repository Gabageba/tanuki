import { HOME_SECTION_KIND, type EnumLiteralsOf } from '@tanuki/contracts';
import { FILTER_GROUP } from '../../core/filters/group';
import type { RawHomeSectionInfo } from '../../types';
import type { GroupleTrendTab } from './config';

export const GROUPLE_ELEMENT_TYPE = {
  GENRE: 'genre',
  TAG: 'tag',
  YEAR: 'year',
  ANOTHER: 'another',
  LIMITATION: 'limitation',
  GOURNAL: 'gournal',
  PUBLISHER: 'publisher',
} as const;
export type GroupleElementType = EnumLiteralsOf<typeof GROUPLE_ELEMENT_TYPE>;

export const GROUPLE_TRANSLATION_STATUS = {
  FINISHED: 'FINISHED',
  PROGRESS: 'PROGRESS',
  POSTPONED: 'POSTPONED',
  NONE: 'NONE',
} as const;
export type GroupleTranslationStatus = EnumLiteralsOf<typeof GROUPLE_TRANSLATION_STATUS>;

export const GROUPLE_FILTER_GROUP = {
  GENRE: FILTER_GROUP.GENRE,
  CATEGORY: FILTER_GROUP.CATEGORY,
  AGE_RATING: FILTER_GROUP.AGE_RATING,
  MISC: FILTER_GROUP.MISC,
  PRODUCTION_STATUS: FILTER_GROUP.PRODUCTION_STATUS,
  TRANSLATION_STATUS: FILTER_GROUP.TRANSLATION_STATUS,
  SEARCH_FILTER: FILTER_GROUP.SEARCH_FILTER,
  YEAR: FILTER_GROUP.YEAR,
} as const;
export type GroupleFilterGroup = EnumLiteralsOf<typeof GROUPLE_FILTER_GROUP>;

export type CatalogElementJson = {
  id: number;
  typeName: GroupleElementType;
  name: string;
};

export type CatalogCategoryJson = {
  id: number;
  typeName: 'category';
  name: string;
};

export type CatalogItemJson = {
  elementId: { linkName: string; siteId: number };
  name: string;
  picUrl: string | null;
  category?: CatalogCategoryJson | null;
  elements?: CatalogElementJson[];
  translationStatus: GroupleTranslationStatus;
  rating?: { voteCount: number; rate: number };
  chaptersCount?: number | null;
};

export type CatalogSearchResponseJson = {
  total: number;
  list: CatalogItemJson[];
};

/** Блоки главной сети Grouple — вёрстка одна на ReadManga, MintManga, SelfManga, SeiManga и
 *  AllHentai (проверено вживую 2026-10-12). «Горячие новинки» и «Обновление популярного» —
 *  вкладки карусели «Тренды», отдаются в `<template data-tab-content>`; «Сейчас читают» на
 *  главной блоком нет — это пункт меню. */
export const GROUPLE_HOME_SECTION = {
  HOT_NEW: 'hotNew',
  POPULAR_UPDATES: 'popularUpdates',
  POPULAR_NOW: 'popularNow',
  LATEST_UPDATES: 'latestUpdates',
} as const;

export const GROUPLE_HOME_SECTIONS = [
  { id: GROUPLE_HOME_SECTION.HOT_NEW, title: 'Горячие новинки', kind: HOME_SECTION_KIND.NEW },
  {
    id: GROUPLE_HOME_SECTION.POPULAR_UPDATES,
    title: 'Обновление популярного',
    kind: HOME_SECTION_KIND.UPDATES,
  },
  {
    id: GROUPLE_HOME_SECTION.POPULAR_NOW,
    title: 'Популярная сейчас манга',
    kind: HOME_SECTION_KIND.POPULAR,
  },
  {
    id: GROUPLE_HOME_SECTION.LATEST_UPDATES,
    title: 'Последние обновления каталога',
    kind: HOME_SECTION_KIND.UPDATES,
  },
];

/** Блок жанровой вкладки «Трендов» — по id элемента сайта. */
export const getGroupleTrendTabSectionId = (elementId: number) => `element${elementId}`;

/** Блоки главной сайта: жанровые вкладки «Трендов» встают сразу за двумя её локальными
 *  вкладками — в том же порядке, что на сайте. */
export const getGroupleHomeSections = (trendTabs: GroupleTrendTab[]): RawHomeSectionInfo[] => [
  ...GROUPLE_HOME_SECTIONS.slice(0, 2),
  ...trendTabs.map(({ elementId, title }) => ({
    id: getGroupleTrendTabSectionId(elementId),
    title,
    kind: HOME_SECTION_KIND.TRENDING,
  })),
  ...GROUPLE_HOME_SECTIONS.slice(2),
];

/** Вкладка карусели «Тренды» блока — `data-tab-content` её шаблона. */
export const getGroupleTrendTab = (
  section: typeof GROUPLE_HOME_SECTION.HOT_NEW | typeof GROUPLE_HOME_SECTION.POPULAR_UPDATES,
) => {
  switch (section) {
    case GROUPLE_HOME_SECTION.HOT_NEW:
      return 'hot-list';
    case GROUPLE_HOME_SECTION.POPULAR_UPDATES:
      return 'popular-latest';
  }
};

/** Значения REST API Grouple — написание закреплено внешним контрактом. */
export const GROUPLE_BOOKMARK_STATUS = {
  WATCHING: 'WATCHING',
  REVIEWING: 'REVIEWING',
  PLANNED: 'PLANED',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  FAVORITE: 'FAVORITE',
  DROPPED: 'DROPPED',
  USER_DEFINED: 'USER_DEFINED',
  USER_DEFINED_TWO: 'USER_DEFINED_TWO',
  USER_DEFINED_THREE: 'USER_DEFINED_THREE',
} as const;

export type GroupleBookmarkStatus = EnumLiteralsOf<typeof GROUPLE_BOOKMARK_STATUS>;

export type GroupleBookmarkSettings = {
  custom1Enabled?: boolean;
  custom2Enabled?: boolean;
  custom3Enabled?: boolean;
  customName1?: string;
  customName2?: string;
  customName3?: string;
};

export type GroupleBookmarkItem = {
  element: {
    elementId: { siteId: number; type?: string };
    elementUrl: string;
    name: string;
    picUrl?: string | null;
  };
  resume?: { url: string; title?: string } | null;
};

export type GroupleBookmarksResponse = {
  list: GroupleBookmarkItem[];
  total: number;
};

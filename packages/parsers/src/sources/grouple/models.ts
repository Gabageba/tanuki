import type { EnumLiteralsOf } from '@tanuki/contracts';
import { FILTER_GROUP } from '../../core/filters/group';

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
  { id: GROUPLE_HOME_SECTION.HOT_NEW, title: 'Горячие новинки' },
  { id: GROUPLE_HOME_SECTION.POPULAR_UPDATES, title: 'Обновление популярного' },
  { id: GROUPLE_HOME_SECTION.POPULAR_NOW, title: 'Популярная сейчас манга' },
  { id: GROUPLE_HOME_SECTION.LATEST_UPDATES, title: 'Последние обновления каталога' },
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

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

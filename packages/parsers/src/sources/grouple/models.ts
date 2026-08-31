import type { EnumLiteralsOf } from '@tanuki/contracts';

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

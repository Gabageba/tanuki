import {
  BUILT_IN_BOOKMARK_FOLDER,
  type BuiltInBookmarkFolder,
  type EnumLiteralsOf,
} from '@tanuki/contracts';

/** Шаги импорта с источника: выбор источника, чтение закладок, выбор тайтлов. */
export const SOURCE_IMPORT_STEP = {
  SOURCE: 'source',
  PARSING: 'parsing',
  TITLES: 'titles',
} as const;
export type SourceImportStep = EnumLiteralsOf<typeof SOURCE_IMPORT_STEP>;

/** Сколько заглушка изображает чтение закладок с источника. */
export const MOCK_PARSING_DURATION_MS = 2000;

export type MockImportTitle = {
  id: string;
  name: string;
  status: BuiltInBookmarkFolder;
  /** В закладках уже есть подтверждённая копия — импорт добавит к ней источник, а не дубль. */
  isInBookmarks: boolean;
};

/** Что «нашлось» в закладках на источнике — сам источник не опрашивается, это заглушка. */
export const MOCK_IMPORT_TITLES: MockImportTitle[] = [
  {
    id: 'berserk',
    name: 'Берсерк',
    status: BUILT_IN_BOOKMARK_FOLDER.READING,
    isInBookmarks: false,
  },
  {
    id: 'vagabond',
    name: 'Бродяга',
    status: BUILT_IN_BOOKMARK_FOLDER.READING,
    isInBookmarks: true,
  },
  {
    id: 'dorohedoro',
    name: 'Дорохедоро',
    status: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
    isInBookmarks: false,
  },
  {
    id: 'monster',
    name: 'Монстр',
    status: BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
    isInBookmarks: false,
  },
  { id: 'pluto', name: 'Плутон', status: BUILT_IN_BOOKMARK_FOLDER.DROPPED, isInBookmarks: true },
];

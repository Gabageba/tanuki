import type { EnumLiteralsOf } from '@tanuki/contracts';
import { MOCK_BOOKMARK_STATUS, type MockBookmarkStatus } from '../models';

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
  status: MockBookmarkStatus;
  /** В закладках уже есть подтверждённая копия — импорт добавит к ней источник, а не дубль. */
  isInBookmarks: boolean;
};

/** Что «нашлось» в закладках на источнике — сам источник не опрашивается, это заглушка. */
export const MOCK_IMPORT_TITLES: MockImportTitle[] = [
  { id: 'berserk', name: 'Берсерк', status: MOCK_BOOKMARK_STATUS.READING, isInBookmarks: false },
  { id: 'vagabond', name: 'Бродяга', status: MOCK_BOOKMARK_STATUS.READING, isInBookmarks: true },
  {
    id: 'dorohedoro',
    name: 'Дорохедоро',
    status: MOCK_BOOKMARK_STATUS.PLANNED,
    isInBookmarks: false,
  },
  { id: 'monster', name: 'Монстр', status: MOCK_BOOKMARK_STATUS.COMPLETED, isInBookmarks: false },
  { id: 'pluto', name: 'Плутон', status: MOCK_BOOKMARK_STATUS.DROPPED, isInBookmarks: true },
];

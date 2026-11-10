import { CONTENT_RATING, SOURCE_ID } from '@tanuki/contracts';
import { BASIC_EXAMPLES_SET } from '../BookmarkUpdates/mocks';
import { BASIC_EXAMPLES } from '../TitleBookmarkMarkers/mocks';
import type { ChapterExample } from './models';

// Продолжение макетов закладок: те же снимки и локальные вымышленные обложки.
const BASE_BOOKMARK = BASIC_EXAMPLES_SET[0]!.bookmark;
const READING_FOLDER = BASIC_EXAMPLES[1]!.folder;
const FAVORITE_FOLDER = BASIC_EXAMPLES[0]!.folder;

export const EXAMPLES: ChapterExample[] = [
  {
    bookmark: {
      ...BASE_BOOKMARK,
      name: 'Ван Пис',
      newChaptersCount: 2,
      latestChapterNumber: 1093,
      latestNewAt: '2026-11-10T04:00:00Z',
    },
    folder: READING_FOLDER,
    typeLabel: 'Манга',
  },
  {
    bookmark: {
      ...BASIC_EXAMPLES_SET[1]!.bookmark,
      newChaptersCount: 12,
      latestChapterNumber: 241,
      latestNewAt: '2026-11-09T08:00:00Z',
    },
    folder: READING_FOLDER,
    typeLabel: 'Манга',
  },
  {
    bookmark: {
      ...BASE_BOOKMARK,
      titleId: `${BASE_BOOKMARK.titleId}-garden`,
      name: 'Ночной сад',
      coverUrl: BASIC_EXAMPLES[2]!.title.coverUrl!,
      contentRating: CONTENT_RATING.ADULT,
      newChaptersCount: 35,
      latestChapterNumber: 36,
      latestNewAt: '2026-11-08T08:00:00Z',
    },
    folder: FAVORITE_FOLDER,
    typeLabel: 'Манга',
  },
  {
    bookmark: {
      ...BASE_BOOKMARK,
      titleId: `${BASE_BOOKMARK.titleId}-no-cover`,
      name: 'Город на краю вечности',
      coverUrl: '',
      newChaptersCount: 1,
      latestChapterNumber: null,
      latestNewAt: null,
    },
    folder: READING_FOLDER,
    typeLabel: 'Манга',
  },
];

export const META_EXAMPLES: ChapterExample[] = [
  ...EXAMPLES,
  {
    ...EXAMPLES[0]!,
    bookmark: {
      ...BASE_BOOKMARK,
      titleId: `${BASE_BOOKMARK.titleId}-no-folder`,
      name: 'Провожающая в последний путь Фрирен',
      sourceId: SOURCE_ID.REMANGA,
      newChaptersCount: 2,
      latestChapterNumber: 131,
      latestNewAt: '2026-11-10T04:00:00Z',
    },
    folder: null,
  },
];

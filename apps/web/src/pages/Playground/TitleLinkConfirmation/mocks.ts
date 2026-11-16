import { MATCH_CONFIDENCE, type TitleMatch } from '@tanuki/contracts';
import { MOCK_HARD_COVER_TITLES } from '../Bookmarks/mocks';
import {
  FOUND_MANGALIB,
  FOUND_READMANGA,
  FOUND_REMANGA,
  FOUND_SENKURO,
} from '../TitleSearch/mocks';

// Те же данные, что в макетах поиска; обложки локальные, без запросов к источникам.
const [VIOLET_COVER, BLUE_COVER, , COLOR_COVER] = MOCK_HARD_COVER_TITLES;

export const ORIGINAL_TITLE = {
  ...FOUND_READMANGA.items[0]!,
  coverUrl: VIOLET_COVER!.coverUrl!,
  originalNames: ['Solo Leveling'],
  altNames: ['Я один поднимаю уровень'],
  authors: ['Chugong'],
  artists: ['DUBU (REDICE Studio)'],
};

export const MATCHES: TitleMatch[] = [
  {
    title: {
      ...FOUND_MANGALIB.items[0]!,
      coverUrl: ORIGINAL_TITLE.coverUrl,
      originalNames: ['Solo Leveling'],
      authors: ['Chugong'],
      artists: ['DUBU'],
    },
    confidence: MATCH_CONFIDENCE.CONFIRMED,
    score: 1,
    matchedName: 'Solo Leveling',
    tied: false,
  },
  {
    title: {
      ...FOUND_REMANGA.items[0]!,
      name: 'Я поднимаю уровень в одиночку',
      coverUrl: COLOR_COVER!.coverUrl!,
      originalNames: ['Solo Leveling'],
      authors: ['Chugong'],
      artists: ['DUBU'],
      chaptersCount: 200,
    },
    confidence: MATCH_CONFIDENCE.EXACT,
    score: 0.98,
    matchedName: 'Solo Leveling',
    tied: false,
  },
  {
    title: {
      ...FOUND_SENKURO.items[0]!,
      name: 'Одиночное повышение уровня',
      coverUrl: ORIGINAL_TITLE.coverUrl,
      originalNames: [],
      description: null,
      year: null,
      chaptersCount: null,
      rating: null,
    },
    confidence: MATCH_CONFIDENCE.HIGH,
    score: 0.81,
    matchedName: 'Поднятие уровня в одиночку',
    tied: false,
  },
  {
    title: {
      ...FOUND_MANGALIB.items[1]!,
      coverUrl: BLUE_COVER!.coverUrl!,
      originalNames: ['Solo Leveling: Ragnarok'],
      authors: ['Daul'],
      description:
        'История Сон Су Хо, сына Сон Джин У. Когда граница между мирами снова оказывается под угрозой, ему предстоит пробудить собственные силы.',
    },
    confidence: MATCH_CONFIDENCE.LOW,
    score: 0.58,
    matchedName: 'Solo Leveling',
    tied: true,
  },
  {
    title: {
      ...FOUND_MANGALIB.items[2]!,
      coverUrl: BLUE_COVER!.coverUrl!,
      originalNames: ['Leveling Alone in the Endless Dungeon'],
      authors: ['Ли Мин'],
      description:
        'Ученик магической академии остаётся один в подземелье, где время течёт иначе. За каждым новым уровнем скрывается ещё одна дверь.',
    },
    confidence: MATCH_CONFIDENCE.LOW,
    score: 0.41,
    matchedName: 'Поднятие уровня',
    tied: true,
  },
];

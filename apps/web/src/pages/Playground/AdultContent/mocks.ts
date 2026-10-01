import { SOURCE_ID } from '@tanuki/contracts';
import type { AdultSettings, MockTitle } from './models';

/** Умолчания новой логики: 18+ выключен, обложки размыты. */
export const DEFAULT_SETTINGS: AdultSettings = {
  showAdultSources: false,
  hideAdultTitles: true,
};

/** Обычный тайтл и два тайтла 18+ на обычных источниках. */
export const EXAMPLE_TITLES: MockTitle[] = [
  {
    id: 'regular',
    name: 'Поднятие уровня в одиночку',
    sourceId: SOURCE_ID.MANGALIB,
    isAdult: false,
    type: 'Манхва',
    year: 2018,
    chaptersCount: 201,
    colors: ['indigo', 'cyan'],
  },
  {
    id: 'adult-senkuro',
    name: 'Ночная смена в общежитии',
    sourceId: SOURCE_ID.SENKURO,
    isAdult: true,
    type: 'Манга',
    year: 2021,
    chaptersCount: 64,
    colors: ['grape', 'pink'],
  },
  {
    id: 'adult-mangalib',
    name: 'Мой сосед — суккуб, и это проблема',
    sourceId: SOURCE_ID.MANGALIB,
    isAdult: true,
    type: 'Манхва',
    year: 2023,
    chaptersCount: 37,
    colors: ['red', 'orange'],
  },
];

/** Тайтл, на который кликнули в каталоге, — для заглушки и превью в строке. */
export const LOCKED_TITLE = EXAMPLE_TITLES[1] as MockTitle;

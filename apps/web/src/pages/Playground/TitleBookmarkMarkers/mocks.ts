import {
  BOOKMARK_AVAILABILITY,
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  TITLE_STATE,
  TITLE_TYPE,
} from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { FOUND_READMANGA } from '../TitleSearch/mocks';
import type { MarkerExample } from './models';

const READING_FOLDER: ResolvedBookmarkFolder = {
  id: 'marker-reading',
  builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
  name: 'Читаю',
  icon: BOOKMARK_FOLDER_ICON.BOOK_OPEN,
  color: BOOKMARK_FOLDER_COLOR.BLUE,
  trackUpdates: true,
  count: 12,
  newCount: 3,
};

const FAVORITE_FOLDER: ResolvedBookmarkFolder = {
  ...READING_FOLDER,
  id: 'marker-favorite',
  builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
  name: 'Любимое',
  icon: BOOKMARK_FOLDER_ICON.HEART,
  color: BOOKMARK_FOLDER_COLOR.PINK,
};

const DROPPED_FOLDER: ResolvedBookmarkFolder = {
  ...READING_FOLDER,
  id: 'marker-dropped',
  builtIn: BUILT_IN_BOOKMARK_FOLDER.DROPPED,
  name: 'Брошено',
  icon: BOOKMARK_FOLDER_ICON.ARCHIVE,
  color: BOOKMARK_FOLDER_COLOR.GRAY,
  trackUpdates: false,
};

const CUSTOM_FOLDER: ResolvedBookmarkFolder = {
  ...READING_FOLDER,
  id: 'marker-custom',
  builtIn: null,
  name: 'Перечитать долгими зимними вечерами',
  icon: BOOKMARK_FOLDER_ICON.MOON,
  color: BOOKMARK_FOLDER_COLOR.VIOLET,
};

// Цвета вымышленных обложек, как и у настоящих иллюстраций, не зависят от темы интерфейса.
const getCoverUrl = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 45% 36%)"/><stop offset="1" stop-color="hsl(${hue + 35} 45% 16%)"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><circle cx="230" cy="90" r="90" fill="white" opacity=".15"/><path d="M-40 340 140 125 350 370v60H-40Z" fill="white" opacity=".12"/><path d="M-30 410 190 200 330 350v80H-30Z" fill="black" opacity=".18"/></svg>`)}`;

const BASE_TITLE = FOUND_READMANGA.items[0]!;

const createExample = (
  name: string,
  hue: number,
  folder: ResolvedBookmarkFolder | null,
): MarkerExample => ({
  title: {
    ...BASE_TITLE,
    id: `readmanga_ru:marker-${hue}`,
    slug: `marker-${hue}`,
    name,
    coverUrl: getCoverUrl(hue),
    type: TITLE_TYPE.MANGA,
    year: 1998,
    chaptersCount: 327,
    rating: 9.1,
    releaseState: TITLE_STATE.ONGOING,
    description:
      'Путь странствующего мечника проходит через встречи и поединки. В поисках своего места он учится понимать людей и самого себя.',
    tags: ['Драма', 'Приключения', 'История', 'Сэйнэн', 'Боевые искусства'].map((title, index) => ({
      id: `marker-tag-${index}`,
      title,
    })),
  },
  folder,
});

export const BASIC_EXAMPLES: MarkerExample[] = [
  createExample('Бродяга', 300, FAVORITE_FOLDER),
  createExample(
    'Я поднимаю уровень в одиночку, пока весь мир спит и видит сны о башне бесконечного подземелья',
    215,
    READING_FOLDER,
  ),
  createExample('Монстр', 35, DROPPED_FOLDER),
  createExample('Берсерк', 155, null),
];

const ADULT_EXAMPLE = createExample('Ночной сад', 335, FAVORITE_FOLDER);
const UNAVAILABLE_EXAMPLE = createExample('Песнь далёких звёзд', 250, READING_FOLDER);
const BROKEN_COVER_EXAMPLE = createExample('История с битой обложкой', 75, DROPPED_FOLDER);

export const EDGE_EXAMPLES: MarkerExample[] = [
  createExample('Город на краю вечности', 185, CUSTOM_FOLDER),
  { ...ADULT_EXAMPLE, title: { ...ADULT_EXAMPLE.title, contentRating: CONTENT_RATING.ADULT } },
  { ...UNAVAILABLE_EXAMPLE, availability: BOOKMARK_AVAILABILITY.SOURCE_DOWN },
  {
    ...BROKEN_COVER_EXAMPLE,
    title: { ...BROKEN_COVER_EXAMPLE.title, coverUrl: 'data:image/png;base64,broken' },
  },
];

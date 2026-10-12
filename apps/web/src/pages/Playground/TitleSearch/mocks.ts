import {
  CONTENT_RATING,
  SOURCE_ACCESS,
  SOURCE_CONTENT_TYPE,
  SOURCE_ID,
  SOURCE_LOCALE,
  SOURCE_STATUS,
  TITLE_STATE,
  TITLE_TYPE,
  type Source,
  type Title,
  type TitleState,
  type TitleType,
} from '@tanuki/contracts';
import { MOCK_GROUP_STATUS, type FoundGroup, type MissedGroup } from './models';

export const MOCK_QUERY = 'Поднятие уровня в одиночку';

export const makeSource = (
  id: string,
  title: string,
  domain: string,
  position: number,
): Source => ({
  id,
  title,
  domain,
  locale: SOURCE_LOCALE.RU,
  contentType: SOURCE_CONTENT_TYPE.MANGA,
  status: SOURCE_STATUS.OK,
  statusReason: null,
  statusChangedAt: null,
  checkedAt: null,
  failedProbeStreak: 0,
  lastError: null,
  isAdult: false,
  requiresVpn: false,
  sortOrders: [],
  supportsDirection: false,
  isSearchWithFiltersSupported: true,
  authFamily: null,
  loginRequirement: null,
  loginBenefits: [],
  isLoggedIn: false,
  position,
  isEnabled: true,
  access: SOURCE_ACCESS.AVAILABLE,
});

export type TitleSeed = {
  name: string;
  type: TitleType | null;
  state: TitleState | null;
  year: number | null;
  chapters: number | null;
  rating: number | null;
};

export const makeTitle = (source: Source, index: number, seed: TitleSeed): Title => ({
  id: `${source.id}:mock-${index}`,
  sourceId: source.id,
  slug: `mock-${index}`,
  name: seed.name,
  originalNames: [],
  altNames: [],
  coverUrl: `https://picsum.photos/seed/tanuki-search-${source.id}-${index}/300/400`,
  largeCoverUrl: null,
  description:
    'Десять лет назад в мире открылись врата в подземелья, а люди получили силы охотников. Самый слабый из них однажды находит двойное подземелье — и систему, которая видна только ему.',
  authors: [],
  artists: [],
  publishers: [],
  magazines: [],
  translators: [],
  tags: [],
  releaseState: seed.state,
  translationState: null,
  restriction: null,
  contentRating: CONTENT_RATING.SAFE,
  type: seed.type,
  country: null,
  series: [],
  year: seed.year,
  releaseDate: null,
  releaseFormats: [],
  addedAt: null,
  lastUpdatedAt: null,
  rating: seed.rating,
  votesCount: null,
  likes: null,
  views: null,
  chaptersCount: seed.chapters,
  pages: null,
  publicUrl: 'https://example.com',
});

const SEEDS: TitleSeed[] = [
  {
    name: 'Поднятие уровня в одиночку',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.FINISHED,
    year: 2018,
    chapters: 201,
    rating: 9.4,
  },
  {
    name: 'Поднятие уровня в одиночку: Рагнарёк',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ONGOING,
    year: 2024,
    chapters: 38,
    rating: 8.1,
  },
  {
    name: 'Поднятие уровня в одиночку: Восход',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.UPCOMING,
    year: 2026,
    chapters: null,
    rating: null,
  },
  {
    name: 'Я поднимаю уровень в одиночку, пока весь мир спит и видит сны о башне бесконечного подземелья',
    type: TITLE_TYPE.MANHUA,
    state: TITLE_STATE.ONGOING,
    year: 2022,
    chapters: 1240,
    rating: 7.2,
  },
  {
    name: 'Одиночка повышает уровень',
    type: null,
    state: TITLE_STATE.PAUSED,
    year: 2021,
    chapters: 64,
    rating: 6.8,
  },
  {
    name: 'Поднятие уровня гения в академии магии',
    type: TITLE_TYPE.MANHWA,
    state: null,
    year: 2023,
    chapters: 112,
    rating: 8.6,
  },
  {
    name: 'Возвращение игрока-одиночки',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ONGOING,
    year: 2020,
    chapters: 156,
    rating: 8.9,
  },
  {
    name: 'Уровень один: охотник',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.ABANDONED,
    year: 2019,
    chapters: 27,
    rating: 5.9,
  },
  {
    name: 'Поднимаю уровень, пока никто не видит',
    type: TITLE_TYPE.MANHUA,
    state: TITLE_STATE.ONGOING,
    year: 2025,
    chapters: 89,
    rating: 7.7,
  },
  {
    name: 'Поднятие уровня с нуля',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.FINISHED,
    year: 2017,
    chapters: 48,
    rating: 7.0,
  },
];

const READMANGA = makeSource(SOURCE_ID.READMANGA_RU, 'ReadManga', 'web.usagi.one', 0);
const MANGALIB = makeSource(SOURCE_ID.MANGALIB, 'MangaLib', 'mangalib.me', 1);
const REMANGA = makeSource(SOURCE_ID.REMANGA, 'Реманга', 'remanga.org', 2);
const USAGI = makeSource(SOURCE_ID.USAGI, 'Usagi', 'web.usagi.one', 3);
const SENKURO = makeSource(SOURCE_ID.SENKURO, 'Senkuro', 'senkuro.me', 4);
const INKSTORY = makeSource(SOURCE_ID.INKSTORY, 'Inkstory', 'inkstory.net', 5);
const SLASHLIB = makeSource(SOURCE_ID.YAOILIB, 'SlashLib', 'v2.slashlib.me', 6);
const MANGABUFF = makeSource(SOURCE_ID.MANGABUFF, 'MangaBuff', 'mangabuff.ru', 7);

/** Источники, где поиск поддерживается и включён у пользователя, — для фильтра «Источники». */
export const MOCK_SEARCHABLE_SOURCES: Source[] = [
  READMANGA,
  MANGALIB,
  REMANGA,
  USAGI,
  SENKURO,
  INKSTORY,
  SLASHLIB,
  MANGABUFF,
];

/** Тайтлы источника из общего набора — по номерам в `SEEDS`. */
const pickTitles = (source: Source, indexes: number[]) =>
  SEEDS.flatMap((seed, index) => (indexes.includes(index) ? [makeTitle(source, index, seed)] : []));

export const FOUND_READMANGA: FoundGroup = {
  source: READMANGA,
  items: pickTitles(READMANGA, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
};
export const FOUND_MANGALIB: FoundGroup = {
  source: MANGALIB,
  items: pickTitles(MANGALIB, [0, 1, 3, 4, 5, 6]),
};
export const FOUND_REMANGA: FoundGroup = { source: REMANGA, items: pickTitles(REMANGA, [0, 1, 2]) };
export const FOUND_SENKURO: FoundGroup = { source: SENKURO, items: pickTitles(SENKURO, [0]) };

/** Где нашлось: 10, 6, 3 и 1 карточка, в порядке `Source.position`. */
export const MOCK_FOUND: FoundGroup[] = [
  FOUND_READMANGA,
  FOUND_MANGALIB,
  FOUND_REMANGA,
  FOUND_SENKURO,
];

/** По одному на каждую причину. */
export const MOCK_MISSED: MissedGroup[] = [
  { source: USAGI, status: MOCK_GROUP_STATUS.TIMEOUT },
  { source: INKSTORY, status: MOCK_GROUP_STATUS.ERROR },
  { source: SLASHLIB, status: MOCK_GROUP_STATUS.LOCKED },
  { source: MANGABUFF, status: MOCK_GROUP_STATUS.UNAVAILABLE },
];

/** Недавние запросы, свежие сверху; есть длинный — чтобы видеть обрезку. */
export const MOCK_RECENT: string[] = [
  MOCK_QUERY,
  'Берсерк',
  'Магическая битва',
  'Re:Zero. Жизнь с нуля в альтернативном мире — Арка 4: Вечный договор',
  'Ван Пис',
  'Монолог фармацевта',
  'Фрирен',
];

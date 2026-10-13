import {
  CONTENT_RATING,
  SOURCE_ID,
  TITLE_STATE,
  TITLE_TYPE,
  type Source,
  type Title,
} from '@tanuki/contracts';
import { makeSource, makeTitle, type TitleSeed } from '../TitleSearch/mocks';
import {
  HOME_KIND,
  type ContinueItem,
  type HomeBlock,
  type HomeKind,
  type HomeSource,
} from './models';

export { MOCK_MISSED } from '../TitleSearch/mocks';

const REMANGA = makeSource(SOURCE_ID.REMANGA, 'Реманга', 'remanga.org', 0);
const MANGALIB = makeSource(SOURCE_ID.MANGALIB, 'MangaLib', 'mangalib.me', 1);
const DESU = makeSource(SOURCE_ID.DESUME, 'Desu', 'desu.city', 2);
const SENKURO = makeSource(SOURCE_ID.SENKURO, 'Senkuro', 'senkuro.me', 3);
const READMANGA = makeSource(SOURCE_ID.READMANGA_RU, 'ReadManga', 'web.usagi.one', 4);
const HENTAILIB = {
  ...makeSource(SOURCE_ID.HENTAILIB, 'HentaiLib', 'hentailib.me', 5),
  isAdult: true,
};

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
    name: 'Башня бога',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ONGOING,
    year: 2010,
    chapters: 642,
    rating: 9.1,
  },
  {
    name: 'Монолог фармацевта',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.ONGOING,
    year: 2017,
    chapters: 78,
    rating: 9.3,
  },
  {
    name: 'Магическая битва',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.FINISHED,
    year: 2018,
    chapters: 271,
    rating: 8.8,
  },
  {
    name: 'Фрирен, провожающая в последний путь',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.ONGOING,
    year: 2020,
    chapters: 140,
    rating: 9.5,
  },
  {
    name: 'Возвращение мага восьмого круга',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ONGOING,
    year: 2025,
    chapters: 12,
    rating: null,
  },
  {
    name: 'Я стал злодейкой в романе, который сама и написала, и теперь мне нужно выжить до финала',
    type: TITLE_TYPE.MANHUA,
    state: TITLE_STATE.ONGOING,
    year: 2024,
    chapters: 1240,
    rating: 7.6,
  },
  {
    name: 'Берсерк',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.PAUSED,
    year: 1989,
    chapters: 380,
    rating: 9.6,
  },
  {
    name: 'Всеведущий читатель',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ONGOING,
    year: 2020,
    chapters: 230,
    rating: 9.2,
  },
  {
    name: 'Ван Пис',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.ONGOING,
    year: 1997,
    chapters: 1160,
    rating: 9.0,
  },
  {
    name: 'Кулинарные скитания в параллельном мире',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.ONGOING,
    year: 2016,
    chapters: 74,
    rating: 8.2,
  },
  {
    name: 'Охотник ранга F',
    type: null,
    state: TITLE_STATE.UPCOMING,
    year: 2026,
    chapters: null,
    rating: null,
  },
  {
    name: 'Рыцарь-одиночка',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ABANDONED,
    year: 2019,
    chapters: 44,
    rating: 6.4,
  },
  {
    name: 'Семья шпиона',
    type: TITLE_TYPE.MANGA,
    state: TITLE_STATE.ONGOING,
    year: 2019,
    chapters: 112,
    rating: 8.9,
  },
  {
    name: 'Ученик бессмертного',
    type: TITLE_TYPE.MANHUA,
    state: TITLE_STATE.ONGOING,
    year: 2021,
    chapters: 520,
    rating: 7.1,
  },
  {
    name: 'Последний дракон Севера',
    type: TITLE_TYPE.MANHWA,
    state: TITLE_STATE.ONGOING,
    year: 2023,
    chapters: 67,
    rating: 8.0,
  },
];

/** Общий набор тайтлов — им пользуются и макеты вкладок подборок. */
export const MOCK_TITLE_SEEDS = SEEDS;

/** Затравка по номеру, по кругу. */
const seedAt = (index: number) => {
  const seed = SEEDS[index % SEEDS.length];
  if (!seed) throw new Error('SEEDS is empty');
  return seed;
};

/** Блок источника: `count` тайтлов из общего набора, со сдвигом — чтобы соседние блоки различались. */
const makeBlock = (
  source: Source,
  blockIndex: number,
  id: string,
  title: string,
  count: number,
): HomeBlock => ({
  id,
  title,
  items: Array.from({ length: count }, (_, index) => {
    const seedIndex = blockIndex * 5 + index * 3;
    return makeTitle(source, blockIndex * 100 + index, seedAt(seedIndex));
  }),
});

export const HOME_REMANGA: HomeSource = {
  source: REMANGA,
  blocks: [
    makeBlock(REMANGA, 0, 'hotNew', 'Горячие новинки', 12),
    makeBlock(REMANGA, 1, 'newSeason', 'Новый сезон', 10),
    makeBlock(REMANGA, 2, 'trending', 'В тренде', 12),
    makeBlock(REMANGA, 3, 'popularToday', 'Популярно сегодня', 10),
    makeBlock(REMANGA, 4, 'newChapters', 'Свежие главы', 12),
    makeBlock(REMANGA, 5, 'popular', 'Популярное', 12),
  ],
};

/** У MangaLib три коротких блока «Сейчас читают» по три тайтла — для оси K. */
export const HOME_MANGALIB: HomeSource = {
  source: MANGALIB,
  blocks: [
    makeBlock(MANGALIB, 0, 'popular', 'Популярное', 12),
    makeBlock(MANGALIB, 1, 'new', 'Новинки', 10),
    makeBlock(MANGALIB, 2, 'readingNowNew', 'Сейчас читают: Новинки', 3),
    makeBlock(MANGALIB, 3, 'readingNowRising', 'Сейчас читают: Набирающее популярность', 3),
    makeBlock(MANGALIB, 4, 'readingNowPopular', 'Сейчас читают: Популярное', 3),
    makeBlock(MANGALIB, 5, 'latestUpdates', 'Последние обновления', 12),
  ],
};

export const HOME_DESU: HomeSource = {
  source: DESU,
  blocks: [
    makeBlock(DESU, 0, 'popularUpdates', 'Обновления популярной манги', 10),
    makeBlock(DESU, 1, 'hotNew', 'Горячие новинки манги', 8),
  ],
};

export const MOCK_HOME: HomeSource[] = [HOME_REMANGA, HOME_MANGALIB, HOME_DESU];

const continueTitle = (source: Source, index: number) =>
  makeTitle(source, 900 + index, seedAt(index * 7));

/** Шесть тайтлов с разных источников: длинное название, глава без номера и без названия, 18+. */
export const MOCK_CONTINUE: ContinueItem[] = [
  {
    title: continueTitle(REMANGA, 1),
    chapterNumber: '12',
    chapterTitle: null,
    readAgo: '5 минут назад',
  },
  {
    title: continueTitle(MANGALIB, 2),
    chapterNumber: '231.5',
    chapterTitle: 'Экстра',
    readAgo: 'вчера',
  },
  {
    title: { ...continueTitle(SENKURO, 3), name: seedAt(6).name },
    chapterNumber: '1240',
    chapterTitle: null,
    readAgo: '2 дня назад',
  },
  {
    title: continueTitle(DESU, 4),
    chapterNumber: null,
    chapterTitle: 'Пролог',
    readAgo: '5 дней назад',
  },
  {
    title: { ...continueTitle(HENTAILIB, 5), contentRating: CONTENT_RATING.ADULT },
    chapterNumber: '8',
    chapterTitle: null,
    readAgo: '2 недели назад',
  },
  {
    title: continueTitle(READMANGA, 6),
    chapterNumber: null,
    chapterTitle: null,
    readAgo: '3 месяца назад',
  },
];

export const HOME_SENKURO: HomeSource = {
  source: SENKURO,
  blocks: [
    makeBlock(SENKURO, 0, 'mostRead', 'Самое читаемое', 10),
    makeBlock(SENKURO, 1, 'latestUpdates', 'Последние обновления', 12),
  ],
};

export const HOME_READMANGA: HomeSource = {
  source: READMANGA,
  blocks: [
    makeBlock(READMANGA, 0, 'hotNew', 'Горячие новинки', 10),
    makeBlock(READMANGA, 1, 'trends', 'Тренды', 10),
    makeBlock(READMANGA, 2, 'popularNow', 'Популярная сейчас манга', 10),
    makeBlock(READMANGA, 3, 'popularUpdates', 'Обновление популярного', 10),
    makeBlock(READMANGA, 4, 'readingNow', 'Сейчас читают', 10),
  ],
};

/** Все источники главной в общем порядке `source_order`. */
export const MOCK_HOME_ALL: HomeSource[] = [
  HOME_REMANGA,
  HOME_MANGALIB,
  HOME_DESU,
  HOME_SENKURO,
  HOME_READMANGA,
];

/** Во вкладке настроек — те же источники: ей нужны только описания блоков. */
export const MOCK_HOME_SETTINGS = MOCK_HOME_ALL;

/** P5 — в какой общий вид ложится блок сайта, по его id. Раскладка — как предложено в плане оси P. */
export const BLOCK_KIND_BY_ID: Record<string, HomeKind> = {
  hotNew: HOME_KIND.NEW,
  newSeason: HOME_KIND.NEW,
  new: HOME_KIND.NEW,
  trending: HOME_KIND.POPULAR,
  trends: HOME_KIND.POPULAR,
  popularToday: HOME_KIND.POPULAR,
  popular: HOME_KIND.POPULAR,
  popularNow: HOME_KIND.POPULAR,
  mostRead: HOME_KIND.POPULAR,
  readingNow: HOME_KIND.POPULAR,
  readingNowNew: HOME_KIND.POPULAR,
  readingNowRising: HOME_KIND.POPULAR,
  readingNowPopular: HOME_KIND.POPULAR,
  newChapters: HOME_KIND.UPDATES,
  latestUpdates: HOME_KIND.UPDATES,
  popularUpdates: HOME_KIND.UPDATES,
};

/** Сколько источников всего в приложении — для «Все источники · 23». */
export const MOCK_SOURCES_TOTAL = 23;

/** Адрес отдельной страницы подборок (P4a) — в приложении его пока нет. */
export const DISCOVER_PATH = '/selections';

/** Закладки с вышедшими главами: тайтл и сколько глав новых. */
export const MOCK_NEW_CHAPTERS: { title: Title; newCount: number }[] = [
  { title: makeTitle(MANGALIB, 950, seedAt(4)), newCount: 3 },
  { title: makeTitle(REMANGA, 951, seedAt(8)), newCount: 1 },
  { title: makeTitle(SENKURO, 952, seedAt(13)), newCount: 12 },
  { title: makeTitle(DESU, 953, seedAt(2)), newCount: 2 },
  { title: makeTitle(READMANGA, 954, seedAt(10)), newCount: 5 },
];

/** Тайтлы, которые не открывали больше месяца, — свежие сверху. */
export const MOCK_STALE: ContinueItem[] = [
  {
    title: makeTitle(REMANGA, 960, seedAt(9)),
    chapterNumber: '344',
    chapterTitle: null,
    readAgo: '5 недель назад',
  },
  {
    title: makeTitle(MANGALIB, 961, seedAt(11)),
    chapterNumber: '17',
    chapterTitle: null,
    readAgo: '2 месяца назад',
  },
  {
    title: makeTitle(DESU, 962, seedAt(14)),
    chapterNumber: '88',
    chapterTitle: null,
    readAgo: '3 месяца назад',
  },
  {
    title: makeTitle(SENKURO, 963, seedAt(15)),
    chapterNumber: '5',
    chapterTitle: null,
    readAgo: '4 месяца назад',
  },
  {
    title: makeTitle(READMANGA, 964, seedAt(1)),
    chapterNumber: '120',
    chapterTitle: null,
    readAgo: 'полгода назад',
  },
  {
    title: makeTitle(REMANGA, 965, seedAt(12)),
    chapterNumber: '9',
    chapterTitle: null,
    readAgo: 'год назад',
  },
];

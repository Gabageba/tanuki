import { SOURCE_ID, SOURCE_STATUS, type Source, type Title } from '@tanuki/contracts';
import { makeSource, makeTitle, type TitleSeed } from '../TitleSearch/mocks';
import { MOCK_TITLE_SEEDS } from '../Home/mocks';
import { BLOCK_KIND, type BlockKind, type MockBlock, type MockSelectionsSource } from './models';

const block = (
  id: string,
  title: string,
  kind: BlockKind,
  pageSize: number,
  pages: number,
): MockBlock => ({ id, title, kind, pageSize, pages });

const withPeriod = (item: MockBlock): MockBlock => ({ ...item, hasPeriod: true });

/** Порядок — общий `source_order`; у каждого источника свой набор блоков и своя пагинация, по
 *  тому, что видно в парсерах: JSON-API с порциями — листается, HTML-главная и слайдеры — нет. */
const entry = (
  id: string,
  title: string,
  domain: string,
  position: number,
  blocks: MockBlock[],
): MockSelectionsSource => ({ source: makeSource(id, title, domain, position), blocks });

export const SEL_REMANGA = entry(SOURCE_ID.REMANGA, 'Реманга', 'remanga.org', 0, [
  block('hotNew', 'Горячие новинки', BLOCK_KIND.NEW, 20, 5),
  block('newSeason', 'Новый сезон', BLOCK_KIND.NEW, 20, 1),
  block('trending', 'В тренде', BLOCK_KIND.TRENDING, 20, 1),
  block('popularToday', 'Популярно сегодня', BLOCK_KIND.TOP, 20, 1),
  block('newChapters', 'Свежие главы', BLOCK_KIND.UPDATES, 20, 6),
  block('popular', 'Популярное', BLOCK_KIND.POPULAR, 20, 1),
]);

export const SEL_MANGALIB = entry(SOURCE_ID.MANGALIB, 'MangaLib', 'mangalib.me', 1, [
  block('popular', 'Популярное', BLOCK_KIND.POPULAR, 24, 4),
  block('new', 'Новинки', BLOCK_KIND.NEW, 24, 4),
  withPeriod(block('readingNowNew', 'Сейчас читают: новинки', BLOCK_KIND.TRENDING, 20, 3)),
  withPeriod(
    block('readingNowRising', 'Сейчас читают: набирающее популярность', BLOCK_KIND.TRENDING, 20, 3),
  ),
  withPeriod(block('readingNowPopular', 'Сейчас читают: популярное', BLOCK_KIND.TOP, 20, 3)),
  block('latestUpdates', 'Последние обновления', BLOCK_KIND.UPDATES, 24, 6),
]);

/** P3 — MangaLib, где три «Сейчас читают: …» слиты в одну вкладку, как на сайте. */
export const SEL_MANGALIB_MERGED: MockSelectionsSource = {
  ...SEL_MANGALIB,
  blocks: [
    ...SEL_MANGALIB.blocks.filter(({ hasPeriod }) => !hasPeriod).slice(0, 2),
    {
      ...block('readingNow', 'Сейчас читают', BLOCK_KIND.TRENDING, 20, 3),
      hasPeriod: true,
      variants: [
        { id: 'new', title: 'Новинки' },
        { id: 'rising', title: 'Набирающее популярность' },
        { id: 'popular', title: 'Популярное' },
      ],
    },
    ...SEL_MANGALIB.blocks.filter(({ id }) => id === 'latestUpdates'),
  ],
};

export const SEL_DESU = entry(SOURCE_ID.DESUME, 'Desu', 'desu.city', 2, [
  block('popularUpdates', 'Обновления популярной манги', BLOCK_KIND.UPDATES, 10, 1),
  block('hotNew', 'Горячие новинки манги', BLOCK_KIND.NEW, 8, 1),
]);

export const SEL_SENKURO = entry(SOURCE_ID.SENKURO, 'Senkuro', 'senkuro.me', 3, [
  block('mostRead', 'Самое читаемое', BLOCK_KIND.TOP, 21, 5),
  block('latestUpdates', 'Последние обновления', BLOCK_KIND.UPDATES, 21, 5),
]);

export const SEL_READMANGA = entry(SOURCE_ID.READMANGA_RU, 'ReadManga', 'web.usagi.one', 4, [
  block('hotNew', 'Горячие новинки', BLOCK_KIND.NEW, 12, 1),
  block('popularUpdates', 'Обновление популярного', BLOCK_KIND.UPDATES, 12, 1),
  block('popularNow', 'Популярная сейчас манга', BLOCK_KIND.POPULAR, 12, 1),
  block('latestUpdates', 'Сейчас читают', BLOCK_KIND.TRENDING, 12, 1),
]);

export const SEL_MANGABUFF = entry(SOURCE_ID.MANGABUFF, 'MangaBuff', 'mangabuff.ru', 5, [
  block('hotNew', 'Горячие новинки', BLOCK_KIND.NEW, 12, 1),
  block('popularWeek', 'Популярно на неделе', BLOCK_KIND.TOP, 10, 1),
  block('bestOngoings', 'Лучшие онгоинги', BLOCK_KIND.POPULAR, 10, 1),
  block('newOnSite', 'Новое на сайте', BLOCK_KIND.NEW, 12, 1),
  block('updates', 'Обновления', BLOCK_KIND.UPDATES, 12, 1),
]);

export const SEL_INKSTORY = entry(SOURCE_ID.INKSTORY, 'Inkstory', 'inkstory.net', 6, [
  block('popular', 'Популярное', BLOCK_KIND.POPULAR, 12, 1),
  block('popularOngoings', 'Популярные онгоинги', BLOCK_KIND.TRENDING, 12, 1),
  block('bestFinished', 'Лучшие завершённые', BLOCK_KIND.TOP, 12, 1),
  block('recentlyAdded', 'Недавно добавлено', BLOCK_KIND.NEW, 12, 1),
  block('latestUpdates', 'Последние обновления', BLOCK_KIND.UPDATES, 24, 6),
]);

export const SEL_WAMANGA = entry(SOURCE_ID.WAMANGA, 'WaManga', 'wamanga.me', 7, [
  block('dayTop', 'Топ за день', BLOCK_KIND.TOP, 10, 1),
  block('new', 'Новинки', BLOCK_KIND.NEW, 12, 1),
  block('ongoing', 'Онгоинг', BLOCK_KIND.POPULAR, 12, 1),
  block('freshUpdates', 'Свежие обновления', BLOCK_KIND.UPDATES, 12, 1),
]);

export const SEL_TOMILOLIB = entry(SOURCE_ID.TOMILOLIB, 'TomiloLib', 'tomilolib.com', 8, [
  block('popularWeek', 'Популярное за неделю', BLOCK_KIND.POPULAR, 12, 1),
  block('topFive', 'Топ-5 недели', BLOCK_KIND.TOP, 5, 1),
  block('updates', 'Обновления', BLOCK_KIND.UPDATES, 12, 1),
]);

export const SEL_MULTPORN: MockSelectionsSource = {
  source: { ...makeSource(SOURCE_ID.MULTPORN, 'MultPorn', 'multporn.net', 9), isAdult: true },
  blocks: [block('new', 'Новое', BLOCK_KIND.NEW, 16, 1)],
};

/** Все источники подборок в общем порядке — десять, чтобы селектору было что листать. */
export const MOCK_SELECTIONS: MockSelectionsSource[] = [
  SEL_REMANGA,
  SEL_MANGALIB,
  SEL_DESU,
  SEL_SENKURO,
  SEL_READMANGA,
  SEL_MANGABUFF,
  SEL_INKSTORY,
  SEL_WAMANGA,
  SEL_TOMILOLIB,
  SEL_MULTPORN,
];

/** Источник, который сейчас лежит, — для состояния «не ответил». */
export const SEL_DOWN: MockSelectionsSource = {
  ...SEL_SENKURO,
  source: { ...SEL_SENKURO.source, status: SOURCE_STATUS.DOWN },
};

const seedAt = (index: number): TitleSeed => {
  const seed = MOCK_TITLE_SEEDS[index % MOCK_TITLE_SEEDS.length];
  if (!seed) throw new Error('MOCK_TITLE_SEEDS is empty');
  return seed;
};

/** Порция блока: тайтлы со сдвигом по номеру блока и порции, чтобы соседние вкладки различались.
 *  `salt` — период и что внутри блока: смена периода приносит другие тайтлы. */
export const makeBlockPage = (
  source: Source,
  blockItem: MockBlock,
  page: number,
  salt = '',
): Title[] => {
  const blockIndex = [...`${blockItem.id}${salt}`].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return Array.from({ length: blockItem.pageSize }, (_, index) => {
    const number = page * blockItem.pageSize + index;
    return makeTitle(source, blockIndex * 1000 + number, seedAt(blockIndex + number * 7));
  });
};

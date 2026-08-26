import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createInkStoryParser } from '../src/sources/inkstory';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'inkstory.net';
const API_HOST = `api.${DOMAIN}`;
const MANGA_ID = 'aaaa-bbbb-1111';

const LIST_MANGA_JSON = {
  id: MANGA_ID,
  name: { ru: 'Ван-Пис', en: 'One Piece' },
  slug: 'one-piece',
  averageRating: 8.5,
  contentStatus: 'SAFE',
  poster: 'https://cdn.inkstory.me/one-piece.jpg',
  status: 'ONGOING',
};

// /v2/books?sort=updatedAt,desc sorts by book metadata edits, not chapter releases, so the
// default 'UPDATED' order reads this feed of latest chapter drops instead — see createInkStoryParser.
const UPDATED_FEED_JSON = JSON.stringify([{ book: LIST_MANGA_JSON }]);

const LIST_JSON = JSON.stringify([LIST_MANGA_JSON]);

const DETAILS_JSON = JSON.stringify({
  id: MANGA_ID,
  name: { ru: 'Ван-Пис', en: 'One Piece' },
  slug: 'one-piece',
  averageRating: 8.7,
  contentStatus: 'SAFE',
  poster: 'https://cdn.inkstory.me/one-piece.jpg',
  labels: [{ name: 'приключения', slug: 'adventure' }],
  status: 'ONGOING',
  relations: [{ type: 'AUTHOR', publisher: { name: 'Oda Eiichiro' } }],
  description: 'Описание тайтла.',
});

const CHAPTERS_JSON = JSON.stringify([
  { id: 'ch-1', number: 1, volume: 1, branchId: 'br-1', createdAt: '2024-01-01T09:30:00.123456Z' },
  { id: 'ch-2', number: 2, volume: 1, branchId: 'br-1', createdAt: '2024-01-02T10:00:00.123456Z' },
]);

const BRANCH_JSON = JSON.stringify({ publishers: [{ name: 'TeamA' }] });

const PAGES_JSON = JSON.stringify({
  pages: [
    { id: 'p1', image: 'https://cdn.inkstory.me/001.jpg' },
    { id: 'p2', image: 'https://cdn.inkstory.me/002.jpg' },
  ],
});

const LABELS_JSON = JSON.stringify([
  { id: 'l-1', slug: 'vampires', name: 'вампиры', kind: 'GENRE' },
  { id: 'l-2', slug: 'harem', name: 'гарем', kind: 'GENRE' },
  { id: 'l-3', slug: 'staff-pick', name: 'выбор редакции', kind: 'COLLECTION' },
]);

const SECRET_KEY = 'UySkp0BzPhwlvP2V';
const SSR_STATE_HTML = `<script id="it-astro-state">["secret-key","${SECRET_KEY}"]</script>`;

const xor = (bytes: Buffer, key: string): Buffer => {
  const keyBytes = Buffer.from(key, 'utf8');
  return Buffer.from(bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]!));
};

const makeContext = (http: FakeHttpClient): ParserContext => {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
};

const setUpFixtures = (): FakeHttpClient => {
  const http = new FakeHttpClient();
  http.register((url) => url.includes('/v2/chapters/ch-'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/v2/chapters?'), {
    status: 200,
    body: CHAPTERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/v2/branches/'), {
    status: 200,
    body: BRANCH_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/v2/labels`), {
    status: 200,
    body: LABELS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/v2/books/${MANGA_ID}`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/v2/books?`), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/v2/chapter-update-feed'), {
    status: 200,
    body: UPDATED_FEED_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url === `https://${DOMAIN}/`, {
    status: 200,
    body: SSR_STATE_HTML,
    contentType: 'text/html; charset=utf-8',
  });
  return http;
};

describe('Inkstory parser conformance', () => {
  const http = setUpFixtures();
  const parser = createInkStoryParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('INKSTORY');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
  });

  it('getList: non-UPDATED order still reads /v2/books with a sort key', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, order: 'POPULARITY' });
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe('Ван-Пис');
  });

  it.each([
    ['POPULARITY', 'viewsCount,desc'],
    ['LIKES', 'likesCount,desc'],
    ['CHAPTERS', 'chaptersCount,desc'],
    ['BOOKMARKS', 'bookmarksCount,desc'],
    ['RATING', 'averageRating,desc'],
    ['NEWEST', 'createdAt,desc'],
  ])('getList: order %s maps to sort=%s', async (order, sortKey) => {
    await parser.getList({ offset: 0, limit: 20, order });
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
    const url = new URL(booksRequest!.url);
    expect(url.searchParams.get('sort')).toBe(sortKey);
  });

  it('getFilters: genre from /v2/labels (COLLECTION kind excluded) plus static and range groups', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      'genre',
      'status',
      'contentStatus',
      'country',
      'format',
      'averageRating',
      'year',
      'chaptersCount',
    ]);

    const genre = groups.find((g) => g.id === 'genre')!;
    expect(genre.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(genre.options).toEqual([
      { key: 'vampires', title: 'Вампиры', count: null },
      { key: 'harem', title: 'Гарем', count: null },
    ]);

    const status = groups.find((g) => g.id === 'status')!;
    expect(status.type).toBe('CHECKBOX');
    expect(status.options).toEqual([
      { key: 'ONGOING', title: 'Онгоинг', count: null },
      { key: 'DONE', title: 'Завершён', count: null },
      { key: 'FROZEN', title: 'Заморожен', count: null },
      { key: 'ANNOUNCE', title: 'Анонс', count: null },
    ]);

    const contentStatus = groups.find((g) => g.id === 'contentStatus')!;
    expect(contentStatus.options.map((o) => o.key)).toEqual([
      'SAFE',
      'UNSAFE',
      'EROTIC',
      'PORNOGRAPHIC',
    ]);

    const country = groups.find((g) => g.id === 'country')!;
    expect(country.options).toEqual([
      { key: 'RUSSIA', title: 'Россия', count: null },
      { key: 'JAPAN', title: 'Япония', count: null },
      { key: 'KOREA', title: 'Корея', count: null },
      { key: 'CHINA', title: 'Китай', count: null },
      { key: 'OTHER', title: 'Другая', count: null },
    ]);

    const format = groups.find((g) => g.id === 'format')!;
    expect(format.options.map((o) => o.key)).toEqual([
      'FOURTH_KOMA',
      'COMPILATION',
      'DOUJINSHI',
      'WEBTOON',
      'COLORED',
      'ARTBOOK',
      'SINGLE',
      'LIGHT',
      'WEB',
    ]);

    const averageRating = groups.find((g) => g.id === 'averageRating')!;
    expect(averageRating.type).toBe('RANGE');
    expect(averageRating.options).toEqual([]);
    expect(averageRating.range).toEqual({ min: 0, max: 10 });

    const chaptersCount = groups.find((g) => g.id === 'chaptersCount')!;
    expect(chaptersCount.type).toBe('RANGE');
    expect(chaptersCount.range).toEqual({ min: 0, max: 10000 });

    const year = groups.find((g) => g.id === 'year')!;
    expect(year.type).toBe('RANGE');
    expect(year.range!.min).toBe(1950);
    expect(year.range!.max).toBe(new Date().getFullYear());
  });

  it('getList with filters: repeated params per group, genre include/exclude are separate params', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'status', key: 'ONGOING' },
        { groupId: 'status', key: 'DONE' },
        { groupId: 'genre', key: 'vampires' },
        { groupId: 'genre', key: 'harem', exclude: true },
        { groupId: 'contentStatus', key: 'SAFE' },
        { groupId: 'country', key: 'JAPAN' },
        { groupId: 'format', key: 'WEBTOON' },
      ],
    });
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
    const url = new URL(booksRequest!.url);
    expect(url.searchParams.getAll('status')).toEqual(['ONGOING', 'DONE']);
    expect(url.searchParams.getAll('labelsInclude')).toEqual(['vampires']);
    expect(url.searchParams.getAll('labelsExclude')).toEqual(['harem']);
    expect(url.searchParams.get('contentStatus')).toBe('SAFE');
    expect(url.searchParams.get('country')).toBe('JAPAN');
    expect(url.searchParams.get('formats')).toBe('WEBTOON');
  });

  it('getList with filters: RANGE selections map to <groupId>Min/<groupId>Max, open-ended sides omitted', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'averageRating', range: { min: 8.5, max: 10 } },
        { groupId: 'year', range: { min: 2020 } },
        { groupId: 'chaptersCount', range: { max: 500 } },
      ],
    });
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
    const url = new URL(booksRequest!.url);
    expect(url.searchParams.get('averageRatingMin')).toBe('8.5');
    expect(url.searchParams.get('averageRatingMax')).toBe('10');
    expect(url.searchParams.get('yearMin')).toBe('2020');
    expect(url.searchParams.has('yearMax')).toBe(false);
    expect(url.searchParams.has('chaptersCountMin')).toBe(false);
    expect(url.searchParams.get('chaptersCountMax')).toBe('500');
  });

  it('getList with filters: bypasses the chapter-update-feed default even with no explicit order', async () => {
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: 'status', key: 'ONGOING' }],
    });
    expect(items).toHaveLength(1);
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails(MANGA_ID);
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.chapters![0]!.branch).toBe('TeamA');
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const pages = await parser.getPages('ch-1');
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://cdn.inkstory.me/001.jpg');
  });

  it('decodeImage: XOR-decodes obfuscated chapter images, passes through everything else', async () => {
    const plaintext = Buffer.from('RIFF....WEBPVP8 fake-but-plausible-payload');
    const obfuscatedUrl =
      'https://static.inuko.me/chapters/f93fcd31/b9b3bb3d-70a3-xc29-b784-205ab9e63611.webp';
    const encoded = xor(plaintext, SECRET_KEY);
    const decoded = await parser.decodeImage!(encoded, obfuscatedUrl);
    expect(decoded.equals(plaintext)).toBe(true);

    const plainUrl =
      'https://static.inuko.me/book/aaaa/poster/65ae6e4c-d952-4ef6-831a-0c982baa72b0.jpeg';
    const untouched = Buffer.from('not obfuscated');
    expect((await parser.decodeImage!(untouched, plainUrl)).equals(untouched)).toBe(true);
  });
});

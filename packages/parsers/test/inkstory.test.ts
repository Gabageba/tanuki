import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_RESTRICTION,
  TITLE_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
} from '@tanuki/contracts';
import { createInkStoryParser, INKSTORY_FILTER_GROUP } from '../src/sources/inkstory';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';
import { checkHome } from './support/home';

const DOMAIN = 'inkstory.net';
// The site's own api.<domain> host is gone — every sibling site of the "inuko" platform now reads
// one shared API, scoped per site by `serviceName`. See createInkStoryParser.
const API_HOST = 'api.inuko.me';
const SERVICE_NAME = 'inkstory';
const MANGA_ID = 'aaaa-bbbb-1111';

const LIST_MANGA_JSON = {
  id: MANGA_ID,
  name: { ru: 'Ван-Пис', en: 'One Piece', original: 'ワンピース' },
  altNames: [{ language: 'EN', name: 'OP' }],
  slug: 'one-piece',
  averageRating: 8.5,
  contentStatus: 'SAFE',
  poster: 'https://cdn.inkstory.me/one-piece.jpg',
  status: 'ONGOING',
  country: 'JAPAN',
  formats: ['WEB'],
  year: 1997,
  chaptersCount: 219,
  viewsCount: 1000,
  likesCount: 500,
  ratingVotesCount: 42,
  createdAt: '2022-01-01T00:00:00Z',
};

// /v2/books?sort=updatedAt,desc sorts by book metadata edits, not chapter releases, so the
// default 'UPDATED' order reads this feed of latest chapter drops instead — see createInkStoryParser.
const UPDATED_FEED_JSON = JSON.stringify([{ book: LIST_MANGA_JSON }]);

const LIST_JSON = JSON.stringify([LIST_MANGA_JSON]);

const DETAILS_JSON = JSON.stringify({
  id: MANGA_ID,
  name: { ru: 'Ван-Пис', en: 'One Piece', original: 'ワンピース' },
  altNames: [{ language: 'EN', name: 'OP' }],
  slug: 'one-piece',
  averageRating: 8.7,
  contentStatus: 'UNSAFE',
  poster: 'https://cdn.inkstory.me/one-piece.jpg',
  labels: [{ name: 'приключения', slug: 'adventure' }],
  status: 'ONGOING',
  relations: [
    { type: 'AUTHOR', publisher: { name: 'Oda Eiichiro' } },
    { type: 'ARTIST', publisher: { name: 'Some Artist' } },
    { type: 'PUBLISHER', publisher: { name: 'Shueisha' } },
    { type: 'MAGAZINE', publisher: { name: 'Weekly Shonen Jump' } },
  ],
  description: 'Описание тайтла.',
  country: 'JAPAN',
  formats: ['WEB'],
  year: 1997,
  chaptersCount: 219,
  viewsCount: 1000,
  likesCount: 500,
  ratingVotesCount: 42,
  createdAt: '2022-01-01T00:00:00Z',
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

const DECRYPTION_KEY = 'UySkp0BzPhwlvP2V';
const SSR_STATE_HTML = `<script>{"root":{decryptionKey:"${DECRYPTION_KEY}",currentDomainId:"inkstory"}}</script>`;

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
    expect(item!.source).toBe(SOURCE_ID.INKSTORY);
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    // /manga/<slug> 404s on the site — the real route is /content/<slug>.
    expect(item!.publicUrl).toBe('https://inkstory.net/content/one-piece');
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.originalTitle).toEqual(['One Piece', 'ワンピース']);
    expect(item!.altTitles).toEqual(['OP']);
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
    expect(item!.country).toBe('Япония');
    expect(item!.year).toBe(1997);
    expect(item!.chaptersCount).toBe(219);
    expect(item!.releaseFormats).toEqual(['Веб']);
    expect(item!.votesCount).toBe(42);
    expect(item!.likes).toBe(500);
    expect(item!.views).toBe(1000);
    expect(item!.addedAt).toBe(Date.UTC(2022, 0, 1));
  });

  it('getList: non-UPDATED order still reads /v2/books with a sort key', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, order: SORT_ORDER.POPULARITY });
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe('Ван-Пис');
  });

  it.each([
    [SORT_ORDER.POPULARITY, 'viewsCount,desc'],
    [SORT_ORDER.LIKES, 'likesCount,desc'],
    [SORT_ORDER.CHAPTERS, 'chaptersCount,desc'],
    [SORT_ORDER.BOOKMARKS, 'bookmarksCount,desc'],
    [SORT_ORDER.RATING, 'averageRating,desc'],
    [SORT_ORDER.RELEASED, 'createdAt,desc'],
  ])('getList: order %s maps to sort=%s', async (order, sortKey) => {
    await parser.getList({ offset: 0, limit: 20, order });
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
    const url = new URL(booksRequest!.url);
    expect(url.searchParams.get('sort')).toBe(sortKey);
  });

  it.each([
    [SORT_ORDER.POPULARITY, 'viewsCount,asc'],
    [SORT_ORDER.RATING, 'averageRating,asc'],
  ])('getList: order %s with direction ASC maps to sort=%s', async (order, sortKey) => {
    await parser.getList({ offset: 0, limit: 20, order, direction: SORT_DIRECTION.ASC });
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
    const url = new URL(booksRequest!.url);
    expect(url.searchParams.get('sort')).toBe(sortKey);
  });

  it('getList: default UPDATED order with direction ASC bypasses the chapter-update-feed and reads /v2/books', async () => {
    await parser.getList({ offset: 0, limit: 20, direction: SORT_DIRECTION.ASC });
    const booksRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${API_HOST}/v2/books?`))
      .at(-1);
    expect(booksRequest).toBeDefined();
    const url = new URL(booksRequest!.url);
    expect(url.searchParams.get('sort')).toBe('updatedAt,asc');
  });

  it('every API request names the service — the shared platform API is not scoped by host', async () => {
    const freshHttp = setUpFixtures();
    const freshParser = createInkStoryParser(makeContext(freshHttp));
    await freshParser.getList({ offset: 0, limit: 20 });
    await freshParser.getList({ offset: 0, limit: 20, order: SORT_ORDER.POPULARITY });
    await freshParser.getDetails(MANGA_ID);
    await freshParser.getPages('ch-1');
    await freshParser.getFilters!();

    const apiRequests = freshHttp.requests.filter((r) => r.url.startsWith(`https://${API_HOST}/`));
    expect(apiRequests.length).toBeGreaterThan(0);
    for (const request of apiRequests) {
      expect(new URL(request.url).searchParams.get('serviceName')).toBe(SERVICE_NAME);
    }
  });

  it('getFilters: genre from /v2/labels (COLLECTION kind excluded) plus static and range groups', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      INKSTORY_FILTER_GROUP.GENRE,
      INKSTORY_FILTER_GROUP.STATUS,
      INKSTORY_FILTER_GROUP.CONTENT_STATUS,
      INKSTORY_FILTER_GROUP.COUNTRY,
      INKSTORY_FILTER_GROUP.FORMAT,
      INKSTORY_FILTER_GROUP.AVERAGE_RATING,
      INKSTORY_FILTER_GROUP.YEAR,
      INKSTORY_FILTER_GROUP.CHAPTERS_COUNT,
    ]);

    const genre = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(genre.options).toEqual([
      { key: 'vampires', title: 'Вампиры', count: null },
      { key: 'harem', title: 'Гарем', count: null },
    ]);

    const status = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options).toEqual([
      { key: 'ONGOING', title: 'Онгоинг', count: null },
      { key: 'DONE', title: 'Завершён', count: null },
      { key: 'FROZEN', title: 'Заморожен', count: null },
      { key: 'ANNOUNCE', title: 'Анонс', count: null },
    ]);

    const contentStatus = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.CONTENT_STATUS)!;
    expect(contentStatus.options.map((o) => o.key)).toEqual([
      'SAFE',
      'UNSAFE',
      'EROTIC',
      'PORNOGRAPHIC',
    ]);

    const country = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.COUNTRY)!;
    expect(country.options).toEqual([
      { key: 'RUSSIA', title: 'Россия', count: null },
      { key: 'JAPAN', title: 'Япония', count: null },
      { key: 'KOREA', title: 'Корея', count: null },
      { key: 'CHINA', title: 'Китай', count: null },
      { key: 'OTHER', title: 'Другая', count: null },
    ]);

    const format = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.FORMAT)!;
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

    const averageRating = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.AVERAGE_RATING)!;
    expect(averageRating.type).toBe(FILTER_TYPE.RANGE);
    expect(averageRating.options).toEqual([]);
    expect(averageRating.settings?.range).toEqual({ min: 0, max: 10 });
    expect(averageRating.settings?.presets).toEqual([
      { id: '9-plus', label: '9+', min: 9 },
      { id: '8-plus', label: '8+', min: 8 },
      { id: '7-plus', label: '7+', min: 7 },
    ]);

    const chaptersCount = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.CHAPTERS_COUNT)!;
    expect(chaptersCount.type).toBe(FILTER_TYPE.RANGE);
    expect(chaptersCount.settings?.range).toEqual({ min: 0, max: 10000 });
    expect(chaptersCount.settings?.presets).toEqual([
      { id: 'lt-20', label: '< 20', max: 20 },
      { id: 'lt-50', label: '< 50', max: 50 },
      { id: '100-200', label: '100-200', min: 100, max: 200 },
      { id: '200-300', label: '200-300', min: 200, max: 300 },
      { id: '300-plus', label: '300+', min: 300 },
    ]);

    const currentYear = new Date().getFullYear();
    const currentDecadeStart = Math.floor(currentYear / 10) * 10;
    const year = groups.find((g) => g.id === INKSTORY_FILTER_GROUP.YEAR)!;
    expect(year.type).toBe(FILTER_TYPE.RANGE);
    expect(year.settings!.range.min).toBe(1950);
    expect(year.settings!.range.max).toBe(currentYear);
    expect(year.settings!.presets![0]).toEqual({
      id: 'current-year',
      label: 'Текущий год',
      min: currentYear,
      max: currentYear,
    });
    expect(year.settings!.presets![1]).toEqual({
      id: `decade-${currentDecadeStart}`,
      label: `${currentDecadeStart}–${currentYear}`,
      min: currentDecadeStart,
      max: currentYear,
    });
    expect(year.settings!.presets!.at(-1)).toEqual({
      id: 'before-2000',
      label: 'Раньше 2000',
      min: 1950,
      max: 1999,
    });
    expect(year.settings!.presets!.every((p) => (p.min ?? 1950) >= 1950)).toBe(true);
  });

  it('getList with filters: repeated params per group, genre include/exclude are separate params', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: INKSTORY_FILTER_GROUP.STATUS, key: 'ONGOING' },
        { groupId: INKSTORY_FILTER_GROUP.STATUS, key: 'DONE' },
        { groupId: INKSTORY_FILTER_GROUP.GENRE, key: 'vampires' },
        { groupId: INKSTORY_FILTER_GROUP.GENRE, key: 'harem', exclude: true },
        { groupId: INKSTORY_FILTER_GROUP.CONTENT_STATUS, key: 'SAFE' },
        { groupId: INKSTORY_FILTER_GROUP.COUNTRY, key: 'JAPAN' },
        { groupId: INKSTORY_FILTER_GROUP.FORMAT, key: 'WEBTOON' },
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
        { groupId: INKSTORY_FILTER_GROUP.AVERAGE_RATING, range: { min: 8.5, max: 10 } },
        { groupId: INKSTORY_FILTER_GROUP.YEAR, range: { min: 2020 } },
        { groupId: INKSTORY_FILTER_GROUP.CHAPTERS_COUNT, range: { max: 500 } },
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
      filters: [{ groupId: INKSTORY_FILTER_GROUP.STATUS, key: 'ONGOING' }],
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
    expect(manga.chapters![0]!.scanlator).toBe('TeamA');
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
    expect(manga.artists).toEqual(['Some Artist']);
    expect(manga.publishers).toEqual(['Shueisha']);
    expect(manga.magazines).toEqual(['Weekly Shonen Jump']);
    // Comes from the chapters' own resolved branch names, reusing getBranchName's result —
    // no separate translators endpoint on the site.
    expect(manga.translators).toEqual(['TeamA']);
    expect(manga.originalTitle).toEqual(['One Piece', 'ワンピース']);
    expect(manga.altTitles).toEqual(['OP']);
    expect(manga.contentRating).toBe(CONTENT_RATING.SUGGESTIVE);
    expect(manga.type).toBe(TITLE_TYPE.MANGA);
    expect(manga.country).toBe('Япония');
    expect(manga.year).toBe(1997);
    expect(manga.publicUrl).toBe('https://inkstory.net/content/one-piece');
    expect(manga.restriction).toBeNull();
  });

  it.each([
    ['SAFE', CONTENT_RATING.SAFE],
    ['UNSAFE', CONTENT_RATING.SUGGESTIVE],
    ['EROTIC', CONTENT_RATING.ADULT],
    ['PORNOGRAPHIC', CONTENT_RATING.ADULT],
  ])('getDetails: contentStatus %s maps to contentRating %s', async (contentStatus, expected) => {
    const freshHttp = new FakeHttpClient();
    freshHttp.register((url) => url.includes('/v2/chapters?'), {
      status: 200,
      body: '[]',
      contentType: 'application/json',
    });
    freshHttp.register((url) => url.startsWith(`https://${API_HOST}/v2/books/${MANGA_ID}`), {
      status: 200,
      body: JSON.stringify({ ...JSON.parse(DETAILS_JSON), contentStatus }),
      contentType: 'application/json',
    });
    freshHttp.register((url) => url.includes('/v2/content-notices'), {
      status: 200,
      body: '[]',
      contentType: 'application/json',
    });
    const parser = createInkStoryParser(makeContext(freshHttp));
    const manga = await parser.getDetails(MANGA_ID);
    expect(manga.contentRating).toBe(expected);
  });

  it.each([
    ['JAPAN', TITLE_TYPE.MANGA],
    ['KOREA', TITLE_TYPE.MANHWA],
    ['CHINA', TITLE_TYPE.MANHUA],
    ['RUSSIA', TITLE_TYPE.COMICS],
    ['OTHER', TITLE_TYPE.OTHER],
    [undefined, null],
  ])('getList: country %s maps to type %s', async (country, type) => {
    const freshHttp = new FakeHttpClient();
    freshHttp.register((url) => url.includes('/v2/chapter-update-feed'), {
      status: 200,
      body: JSON.stringify([{ book: { ...LIST_MANGA_JSON, country } }]),
      contentType: 'application/json',
    });
    const parser = createInkStoryParser(makeContext(freshHttp));
    const [item] = await parser.getList({ offset: 0, limit: 20 });
    expect(item!.type).toBe(type);
  });

  it('getDetails: chaptersCount>0 with empty chapters and a content notice reports LEGAL restriction', async () => {
    const takenDownId = 'cccc-dddd-2222';
    const freshHttp = new FakeHttpClient();
    freshHttp.register((url) => url.includes('/v2/chapters?') && url.includes(takenDownId), {
      status: 200,
      body: '[]',
      contentType: 'application/json',
    });
    freshHttp.register((url) => url.startsWith(`https://${API_HOST}/v2/books/${takenDownId}`), {
      status: 200,
      body: JSON.stringify({ ...JSON.parse(DETAILS_JSON), id: takenDownId }),
      contentType: 'application/json',
    });
    freshHttp.register((url) => url.includes('/v2/content-notices?') && url.includes(takenDownId), {
      status: 200,
      body: JSON.stringify([{ id: 'notice-1', title: 'Про удаление глав' }]),
      contentType: 'application/json',
    });
    const parser = createInkStoryParser(makeContext(freshHttp));
    const manga = await parser.getDetails(takenDownId);
    expect(manga.restriction).toBe(TITLE_RESTRICTION.LEGAL);
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
    const encoded = xor(plaintext, DECRYPTION_KEY);
    const decoded = await parser.decodeImage!(encoded, obfuscatedUrl);
    expect(decoded.equals(plaintext)).toBe(true);

    const plainUrl =
      'https://static.inuko.me/book/aaaa/poster/65ae6e4c-d952-4ef6-831a-0c982baa72b0.jpeg';
    const untouched = Buffer.from('not obfuscated');
    expect((await parser.decodeImage!(untouched, plainUrl)).equals(untouched)).toBe(true);
  });
});

describe('Inkstory getHome', () => {
  it('reads SSR blocks by heading, book id from the cover, latest updates from the feed', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/`, {
      status: 200,
      body: readFixture('inkstory-home.html'),
    });
    http.register((url) => url.includes('/v2/chapter-update-feed'), {
      status: 200,
      body: UPDATED_FEED_JSON,
      contentType: 'application/json',
    });
    const parser = createInkStoryParser(makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);

    const ongoing = sections[0]!.items[0]!;
    // id — тот же uuid книги, что в API каталога, а не slug из ссылки.
    expect(ongoing.url).toMatch(/^[0-9a-f-]{36}$/);
    expect(ongoing.coverUrl).not.toContain('?');
  });
});

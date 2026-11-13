import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  FILTER_TYPE,
  SOURCE_CONTENT_TYPE,
  SOURCE_AUTH_FAMILY,
  TITLE_RESTRICTION,
  TITLE_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
} from '@tanuki/contracts';
import { createInukoParser, INUKO_FILTER_GROUP } from '../src/sources/inuko/engine';
import { INUKO_CONFIGS } from '../src/sources/inuko/config';
import {
  createInukoSessionJar,
  parseInukoSessionValue,
  parseInukoViewer,
} from '../src/sources/inuko/auth';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { ParseError, SourceAuthRequiredError } from '../src/errors';
import { readInukoSsr } from '../src/sources/inuko/ssr';
import { generateUid } from '../src/core/uid';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';
import { checkHome } from './support/home';

const DOMAIN = 'inkstory.net';
const PUREMANGA_DOMAIN = 'v1.puremanga.me';
// The site's own api.<domain> host is gone — every sibling site of the "inuko" platform now reads
// one shared API, scoped per site by `serviceName`. See createInukoParser.
const API_HOST = 'api.inuko.me';
const SERVICE_NAME = 'inkstory';
const PUREMANGA_SERVICE_NAME = 'puremanga.me';
const INKSTORY_CONFIG = INUKO_CONFIGS.find(({ id }) => id === SOURCE_ID.INKSTORY)!;
const PUREMANGA_CONFIG = INUKO_CONFIGS.find(({ id }) => id === SOURCE_ID.PUREMANGA)!;
const MANGA_ID = 'aaaa-bbbb-1111';
const SSR_MANGA_ID = 'd74979c4-40a1-4eb2-afb8-0b741f517319';
const SSR_CHAPTER_ID = '863f51fc-95c8-4167-9974-7bf1ebea6c58';

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
// default 'UPDATED' order reads this feed of latest chapter drops instead — see createInukoParser.
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

const makeContext = (http: FakeHttpClient, domain = DOMAIN): ParserContext => {
  return {
    http,
    domain,
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

describe('Inuko retired reading API', () => {
  const makeSsrHttp = (domain: string) => {
    const http = new FakeHttpClient();
    http.register((url) => url.startsWith(`https://${API_HOST}/v2/books`), {
      status: 404,
      body: 'Not Found',
    });
    http.register((url) => url.includes('/v2/chapters?'), { status: 404, body: 'Not Found' });
    http.register((url) => url.startsWith(`https://${domain}/content/`), {
      status: 200,
      body: readFixture('inuko-reading.html'),
    });
    return http;
  };

  it.each([
    [INKSTORY_CONFIG, DOMAIN],
    [PUREMANGA_CONFIG, PUREMANGA_DOMAIN],
  ])('reads chapters and pages after the API returns 404: %s', async (config, domain) => {
    const http = makeSsrHttp(domain);
    const parser = createInukoParser(config, makeContext(http, domain));
    const details = await parser.getDetails(SSR_MANGA_ID);
    expect(details.title).toBe('Невестка злодея - могущественный человек');
    expect(details.chapters).toHaveLength(2);
    expect(details.chapters![0]).toMatchObject({
      url: `${SSR_MANGA_ID}/${SSR_CHAPTER_ID}`,
      number: 120,
      volume: 3,
      branch: 'Novate',
      source: config.id,
    });
    expect(details.chapters![0]!.id).toBe(generateUid(config.id, SSR_CHAPTER_ID));
    expect(details.restriction).toBeNull();
    // No in-memory book/chapter cache: persisted URLs must work after a restart too.
    const freshParser = createInukoParser(config, makeContext(http, domain));
    const pages = await freshParser.getPages(details.chapters![0]!.url);
    expect(pages).toHaveLength(2);
    expect(pages[0]!.url).toMatch(/^https:\/\/static\.inuko\.me\/chapters\//);
    expect(pages[0]!.source).toBe(config.id);
  });

  it('keeps catalog pagination, sorting, search and include/exclude filters in SSR requests', async () => {
    const http = makeSsrHttp(DOMAIN);
    http.register((url) => url.startsWith(`https://${DOMAIN}/content?`), {
      status: 200,
      body: `<script>($R=>$R[0]={books:$R[1]=${LIST_JSON}})($R["tsr"])</script>`,
    });
    http.register((url) => url.includes('/v2/labels'), {
      status: 200,
      body: LABELS_JSON,
      contentType: 'application/json',
    });
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(http));
    const items = await parser.getList({
      offset: 20,
      limit: 20,
      query: 'Ван-Пис',
      order: SORT_ORDER.RATING,
      direction: SORT_DIRECTION.ASC,
      filters: [
        { groupId: INUKO_FILTER_GROUP.STATUS, key: 'ONGOING' },
        { groupId: INUKO_FILTER_GROUP.STATUS, key: 'DONE' },
        { groupId: INUKO_FILTER_GROUP.GENRE, key: 'vampires' },
        { groupId: INUKO_FILTER_GROUP.GENRE, key: 'harem', exclude: true },
        { groupId: INUKO_FILTER_GROUP.YEAR, range: { min: 2020 } },
      ],
    });
    expect(items[0]!.title).toBe('Ван-Пис');
    const request = http.requests.find(({ url }) => url.startsWith(`https://${DOMAIN}/content?`))!;
    const params = new URL(request.url).searchParams;
    expect(params.get('page')).toBe('1');
    expect(params.get('size')).toBe('20');
    expect(params.get('search')).toBe('Ван-Пис');
    expect(params.get('sort')).toBe('averageRating');
    expect(params.get('orderBy')).toBe('asc');
    expect(JSON.parse(params.get('status')!)).toEqual(['ONGOING', 'DONE']);
    expect(JSON.parse(params.get('labelsInclude')!)).toEqual(['l-1']);
    expect(JSON.parse(params.get('labelsExclude')!)).toEqual(['l-2']);
    expect(params.get('yearMin')).toBe('2020');
  });

  it('resolves shared SSR references without executing scripts', () => {
    const read = readInukoSsr(
      '<script>($R=>$R[0]={book:$R[1]={id:"book",hidden:!1},copy:$R[1]})($R["tsr"])</script>',
      SOURCE_ID.INKSTORY,
    );
    expect(read('copy')).toEqual({ id: 'book', hidden: false });
    const unsafe = readInukoSsr(
      '<script>($R=>$R[0]={book:process.exit(1)})($R["tsr"])</script>',
      SOURCE_ID.INKSTORY,
    );
    expect(() => unsafe('book')).toThrow(ParseError);
    expect(() => read('missing')).toThrow(ParseError);
  });
});

describe('Inkstory parser conformance', () => {
  const http = setUpFixtures();
  const parser = createInukoParser(INKSTORY_CONFIG, makeContext(http));

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
    const freshParser = createInukoParser(INKSTORY_CONFIG, makeContext(freshHttp));
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
      INUKO_FILTER_GROUP.GENRE,
      INUKO_FILTER_GROUP.STATUS,
      INUKO_FILTER_GROUP.CONTENT_STATUS,
      INUKO_FILTER_GROUP.COUNTRY,
      INUKO_FILTER_GROUP.FORMAT,
      INUKO_FILTER_GROUP.AVERAGE_RATING,
      INUKO_FILTER_GROUP.YEAR,
      INUKO_FILTER_GROUP.CHAPTERS_COUNT,
    ]);

    const genre = groups.find((g) => g.id === INUKO_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(genre.options).toEqual([
      { key: 'vampires', title: 'Вампиры', count: null },
      { key: 'harem', title: 'Гарем', count: null },
    ]);

    const status = groups.find((g) => g.id === INUKO_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options).toEqual([
      { key: 'ONGOING', title: 'Онгоинг', count: null },
      { key: 'DONE', title: 'Завершён', count: null },
      { key: 'FROZEN', title: 'Заморожен', count: null },
      { key: 'ANNOUNCE', title: 'Анонс', count: null },
    ]);

    const contentStatus = groups.find((g) => g.id === INUKO_FILTER_GROUP.CONTENT_STATUS)!;
    expect(contentStatus.options.map((o) => o.key)).toEqual([
      'SAFE',
      'UNSAFE',
      'EROTIC',
      'PORNOGRAPHIC',
    ]);

    const country = groups.find((g) => g.id === INUKO_FILTER_GROUP.COUNTRY)!;
    expect(country.options).toEqual([
      { key: 'RUSSIA', title: 'Россия', count: null },
      { key: 'JAPAN', title: 'Япония', count: null },
      { key: 'KOREA', title: 'Корея', count: null },
      { key: 'CHINA', title: 'Китай', count: null },
      { key: 'OTHER', title: 'Другая', count: null },
    ]);

    const format = groups.find((g) => g.id === INUKO_FILTER_GROUP.FORMAT)!;
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

    const averageRating = groups.find((g) => g.id === INUKO_FILTER_GROUP.AVERAGE_RATING)!;
    expect(averageRating.type).toBe(FILTER_TYPE.RANGE);
    expect(averageRating.options).toEqual([]);
    expect(averageRating.settings?.range).toEqual({ min: 0, max: 10 });
    expect(averageRating.settings?.presets).toEqual([
      { id: '9-plus', label: '9+', min: 9 },
      { id: '8-plus', label: '8+', min: 8 },
      { id: '7-plus', label: '7+', min: 7 },
    ]);

    const chaptersCount = groups.find((g) => g.id === INUKO_FILTER_GROUP.CHAPTERS_COUNT)!;
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
    const year = groups.find((g) => g.id === INUKO_FILTER_GROUP.YEAR)!;
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
        { groupId: INUKO_FILTER_GROUP.STATUS, key: 'ONGOING' },
        { groupId: INUKO_FILTER_GROUP.STATUS, key: 'DONE' },
        { groupId: INUKO_FILTER_GROUP.GENRE, key: 'vampires' },
        { groupId: INUKO_FILTER_GROUP.GENRE, key: 'harem', exclude: true },
        { groupId: INUKO_FILTER_GROUP.CONTENT_STATUS, key: 'SAFE' },
        { groupId: INUKO_FILTER_GROUP.COUNTRY, key: 'JAPAN' },
        { groupId: INUKO_FILTER_GROUP.FORMAT, key: 'WEBTOON' },
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
        { groupId: INUKO_FILTER_GROUP.AVERAGE_RATING, range: { min: 8.5, max: 10 } },
        { groupId: INUKO_FILTER_GROUP.YEAR, range: { min: 2020 } },
        { groupId: INUKO_FILTER_GROUP.CHAPTERS_COUNT, range: { max: 500 } },
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
      filters: [{ groupId: INUKO_FILTER_GROUP.STATUS, key: 'ONGOING' }],
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
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(freshHttp));
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
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(freshHttp));
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
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(freshHttp));
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
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);

    const ongoing = sections[0]!.items[0]!;
    // id — тот же uuid книги, что в API каталога, а не slug из ссылки.
    expect(ongoing.url).toMatch(/^[0-9a-f-]{36}$/);
    expect(ongoing.coverUrl).not.toContain('?');
  });
});

describe('Inkstory getBookmarks via SSR and server functions', () => {
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const READING_ID = 'folder-reading';
  const OWN_ID = 'folder-custom';
  const ITEMS_HASH = 'a'.repeat(64);
  const MARKS_HASH = 'b'.repeat(64);
  const book = {
    ...LIST_MANGA_JSON,
    serviceName: 'inkstory',
  };
  const foreignBook = {
    ...LIST_MANGA_JSON,
    id: 'other-book',
    serviceName: 'puremanga.me',
  };

  const seroval = (input: unknown): unknown => {
    if (input === null) return { t: 2, s: 1 };
    if (typeof input === 'string') return { t: 1, s: input };
    if (typeof input === 'number') return { t: 0, s: input };
    if (typeof input === 'boolean') return { t: 2, s: input ? 2 : 3 };
    if (Array.isArray(input)) return { t: 9, i: 0, a: input.map(seroval), o: 0 };
    if (typeof input === 'object') {
      const entries = Object.entries(input);
      return {
        t: 10, i: 0,
        p: { k: entries.map(([key]) => key), v: entries.map(([, value]) => seroval(value)) },
        o: 0,
      };
    }
    throw Error('Unexpected fixture value');
  };
  const json = (data: unknown) => ({
    status: 200,
    body: JSON.stringify(seroval({ result: data, error: null, context: {} })),
    contentType: 'application/json',
  });

  const viewerPage = (loggedIn: boolean) =>
    `<script>$R[1]={currentUser:${loggedIn
      ? `$R[2]={id:"${USER_ID}",username:"Reader"}`
      : 'null'}}</script>`;

  const libraryPage = `<link rel="modulepreload" href="/assets/tanstack-start-test.js"/>
<script>($R=>$R[0]={currentUser:$R[1]={id:"${USER_ID}",username:"Reader"},folders:$R[2]=[
$R[3]={id:"${OWN_ID}",name:"Моя папка",system:!1,sortOrder:6},
$R[4]={id:"${READING_ID}",name:"Читаю",system:!0,sortOrder:1}
]})($R["tsr"])</script>`;

  const javascript = `const l_=m().handler(f("${ITEMS_HASH}")),ou=e=>St({queryKey:["infinite-folder-items-list",{...e}]});
const t1=m().handler(f("${MARKS_HASH}")),Go=e=>T({queryKey:["bookmarks",{bookId:e}]});`;

  const setUp = (domain = DOMAIN, loggedIn = true) => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${domain}/faq`, {
      status: 200, body: viewerPage(loggedIn),
    });
    http.register((url) => url === `https://${domain}/library`, {
      status: 200, body: libraryPage,
    });
    http.register((url) => url === `https://${domain}/assets/tanstack-start-test.js`, {
      status: 200, body: javascript,
    });
    http.register((url) => url.includes(`/_serverFn/${ITEMS_HASH}`), {
      ...json([
        { folderId: READING_ID, bookId: book.id, book },
        { folderId: READING_ID, bookId: foreignBook.id, book: foreignBook },
        { folderId: OWN_ID, bookId: book.id, book },
      ]),
    });
    http.register((url) => url.includes(`/_serverFn/${MARKS_HASH}`), json([
      { bookId: book.id, updatedAt: '2026-01-01T00:00:00Z',
        chapter: { number: 2, volume: 1 } },
      { bookId: book.id, updatedAt: '2026-02-01T00:00:00Z',
        chapter: { number: 42.5, volume: 3 } },
    ]));
    return http;
  };

  const asUser = async <T>(fn: () => Promise<T>, sessionDomain = DOMAIN) => {
    const jar = await createInukoSessionJar(sessionDomain, 'TEST_COOKIE_NOT_REAL');
    return runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.INUKO]: { jar } }, fn);
  };

  it('reads folders, filters neighboring services, preserves the newest progress and does not call v2', async () => {
    const http = setUp();
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(http));
    const folders = await asUser(() => parser.getBookmarks!());
    expect(folders.map(({ name, builtIn }) => ({ name, builtIn }))).toEqual([
      { name: 'Читаю', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING },
      { name: 'Моя папка', builtIn: null },
    ]);
    expect(folders[0]!.items).toEqual([expect.objectContaining({
      url: book.id,
      title: book.name.ru,
      lastChapterNumber: 42.5,
      lastChapterVolume: 3,
    })]);
    expect(folders[1]!.items).toHaveLength(1);
    expect(http.requests.some(({ url }) => url.includes('/v2/'))).toBe(false);
    expect(http.requests.some(({ url }) => url.includes('/_serverFn/'))).toBe(true);
  });

  it('uses the session cookie domain for a sibling source', async () => {
    const http = setUp(PUREMANGA_DOMAIN);
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(http));
    const folders = await asUser(() => parser.getBookmarks!(), PUREMANGA_DOMAIN);
    expect(folders[0]!.items).toHaveLength(1);
    expect(http.requests.some(({ url }) => url.startsWith(`https://${PUREMANGA_DOMAIN}/library`))).toBe(true);
  });

  it('requires a valid session and refuses an unauthenticated library', async () => {
    const http = setUp(DOMAIN, false);
    const parser = createInukoParser(INKSTORY_CONFIG, makeContext(http));
    await expect(asUser(() => parser.getBookmarks!())).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
  });
});

describe('Inuko session', () => {
  it('takes the bare value, the name=value pair or a whole Cookie header', () => {
    expect(parseInukoSessionValue('  NrHoLrFoQijL5sH3  ')).toBe('NrHoLrFoQijL5sH3');
    expect(parseInukoSessionValue('__otaku_session=NrHoLrFoQijL5sH3')).toBe('NrHoLrFoQijL5sH3');
    expect(parseInukoSessionValue('_ga=GA1.1; __otaku_session=NrHo; __ddg1_=x')).toBe('NrHo');
    expect(parseInukoSessionValue('two words')).toBeNull();
    expect(parseInukoSessionValue('')).toBeNull();
  });

  it('reads the viewer from the SSR state, a guest is null', () => {
    expect(
      parseInukoViewer(
        'currentUser:$R[29]={id:"752215b2-799e-4dc8-87ed-e58993c34e8f",username:"Reader",slug:null}',
      ),
    ).toEqual({ id: '752215b2-799e-4dc8-87ed-e58993c34e8f', username: 'Reader' });
    expect(parseInukoViewer('currentUser:null,members:$R[26]=[]')).toBeNull();
  });
});

describe('PureManga', () => {
  /** Те же ответы API, что у Inkstory, — сайты сети различаются доменом и `serviceName`. */
  const setUpPureManga = () => {
    const http = setUpFixtures();
    http.register((url) => url === `https://${PUREMANGA_DOMAIN}/`, {
      status: 200,
      body: SSR_STATE_HTML,
      contentType: 'text/html; charset=utf-8',
    });
    return http;
  };

  it('info comes from the catalog: an adult hentai source on its own domain', () => {
    const parser = createInukoParser(
      PUREMANGA_CONFIG,
      makeContext(setUpPureManga(), PUREMANGA_DOMAIN),
    );

    expect(parser.id).toBe(SOURCE_ID.PUREMANGA);
    expect(parser.info).toMatchObject({
      id: SOURCE_ID.PUREMANGA,
      title: 'PureManga',
      domain: PUREMANGA_DOMAIN,
      contentType: SOURCE_CONTENT_TYPE.HENTAI,
      isAdult: true,
    });
  });

  it('every API request names puremanga.me, titles and chapters carry the PureManga id', async () => {
    const http = setUpPureManga();
    const parser = createInukoParser(PUREMANGA_CONFIG, makeContext(http, PUREMANGA_DOMAIN));

    const [item] = await parser.getList({ offset: 0, limit: 20, order: SORT_ORDER.POPULARITY });
    const details = await parser.getDetails(MANGA_ID);
    await parser.getPages('ch-1');

    expect(item!.source).toBe(SOURCE_ID.PUREMANGA);
    expect(item!.publicUrl).toBe(`https://${PUREMANGA_DOMAIN}/content/one-piece`);
    expect(details.chapters![0]!.source).toBe(SOURCE_ID.PUREMANGA);
    // uid зависит от источника: та же книга сети у Inkstory и PureManga — разные тайтлы.
    const [inkstoryItem] = await createInukoParser(
      INKSTORY_CONFIG,
      makeContext(setUpFixtures()),
    ).getList({ offset: 0, limit: 20, order: SORT_ORDER.POPULARITY });
    expect(item!.id).not.toBe(inkstoryItem!.id);
    const apiRequests = http.requests.filter((r) => r.url.startsWith(`https://${API_HOST}/`));
    expect(apiRequests.length).toBeGreaterThan(0);
    for (const request of apiRequests) {
      expect(new URL(request.url).searchParams.get('serviceName')).toBe(PUREMANGA_SERVICE_NAME);
    }
  });

  it('decodeImage reads the key from the PureManga home page', async () => {
    const http = setUpPureManga();
    const parser = createInukoParser(PUREMANGA_CONFIG, makeContext(http, PUREMANGA_DOMAIN));
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const url = 'https://static.inuko.me/chapter/1/aaaaaaaa-bbbb-xccc-dddd-eeeeeeeeeeee.png';

    const decoded = await parser.decodeImage!(xor(png, DECRYPTION_KEY), url);

    expect(decoded.equals(png)).toBe(true);
    expect(http.requests.some(({ url: u }) => u === `https://${PUREMANGA_DOMAIN}/`)).toBe(true);
  });

  it('getHome reads the same SSR blocks, cards of sibling sites are skipped', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${PUREMANGA_DOMAIN}/`, {
      status: 200,
      body: readFixture('puremanga-home.html'),
    });
    http.register((url) => url.includes('/v2/chapter-update-feed'), {
      status: 200,
      body: UPDATED_FEED_JSON,
      contentType: 'application/json',
    });
    const parser = createInukoParser(PUREMANGA_CONFIG, makeContext(http, PUREMANGA_DOMAIN));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);
    for (const section of sections.slice(0, 3)) {
      expect(section.items).toHaveLength(3);
      for (const item of section.items) {
        expect(item.source).toBe(SOURCE_ID.PUREMANGA);
        expect(item.publicUrl.startsWith(`https://${PUREMANGA_DOMAIN}/content/`)).toBe(true);
      }
    }
  });
});

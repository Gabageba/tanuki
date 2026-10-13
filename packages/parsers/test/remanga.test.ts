import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { FILTER_TYPE, TITLE_TYPE } from '@tanuki/contracts';
import { createRemangaParser, REMANGA_FILTER_GROUP } from '../src/sources/remanga';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'remanga.example';
const API_HOST = `api.${DOMAIN}`;

const LIST_JSON = JSON.stringify({
  results: [
    {
      dir: 'one-piece',
      main_name: 'Ван-Пис',
      secondary_name: 'One Piece',
      avg_rating: 8.5,
      cover: { mid: '/covers/op-mid.jpg', high: '/covers/op-high.jpg' },
      type: { id: 1, name: 'Манга' },
      status: { id: 2 },
      translate_status: { id: 2 },
      issue_year: 1997,
      genres: [{ id: 1, name: 'приключения' }],
      categories: [{ id: 5, name: 'веб' }],
      total_votes: 1432,
      total_views: 4234,
    },
  ],
});

const DETAILS_JSON = JSON.stringify({
  dir: 'one-piece',
  main_name: 'Ван-Пис',
  another_name: 'One Piece / OP',
  secondary_name: 'Wan Pis',
  avg_rating: 8.7,
  cover: { mid: '/covers/op-mid.jpg', high: '/covers/op-high.jpg' },
  type: { id: 1, name: 'Манга' },
  status: { id: 2 },
  translate_status: { id: 2 },
  age_limit: { id: 0 },
  issue_year: 1997,
  genres: [{ id: 1, name: 'приключения' }],
  categories: [{ id: 5, name: 'веб' }],
  description: 'Описание тайтла.',
  creators: [
    { id: 1, name: 'Oda Eiichiro', type: 4 },
    { id: 2, name: 'Shueisha', type: 3 },
  ],
  total_votes: 1432,
  total_views: 4234,
  count_rating: 57,
  branches: [{ id: 555, publishers: [{ name: 'TeamA' }, { name: 'TeamB' }] }],
});

const CHAPTERS_PAGE1_JSON = JSON.stringify({
  results: [
    {
      id: 9001,
      chapter: 1,
      tome: 1,
      name: 'Начало',
      upload_date: '2024-01-01T09:30:00',
      is_paid: false,
      is_bought: false,
      publishers: [{ name: 'TeamA' }],
    },
    {
      id: 9002,
      // Так их и отдаёт живое API — строками.
      chapter: '2',
      tome: '1',
      name: 'Продолжение',
      upload_date: '2024-01-02T10:00:00',
      is_paid: false,
      is_bought: false,
      publishers: [{ name: 'TeamA' }],
    },
  ],
});

const CHAPTERS_PAGE2_JSON = JSON.stringify({ results: [] });

const PAGES_JSON = JSON.stringify({
  pages: [
    { link: 'https://cdn.remanga.example/001.jpg' },
    { link: 'https://cdn.remanga.example/002.jpg' },
  ],
});

const GENRES_JSON = JSON.stringify([
  { id: 1, name: 'Приключения', dir: 'priklyucheniya', description: '' },
  { id: 3, name: 'Боевые искусства', dir: 'boeveiskusstva', description: '' },
]);

const CATEGORIES_JSON = JSON.stringify([
  { id: 5, name: 'Веб', dir: 'veb', description: '' },
  { id: 47, name: 'Алхимия', dir: 'alhimija', description: '' },
]);

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
  http.register((url) => url.startsWith(`https://${API_HOST}/api/v2/titles/genres/`), {
    status: 200,
    body: GENRES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/api/v2/titles/categories/`), {
    status: 200,
    body: CATEGORIES_JSON,
    contentType: 'application/json',
  });
  http.register(
    (url) => url.includes('/api/v2/titles/chapters/?'),
    (() => {
      let calls = 0;
      return () => {
        calls += 1;
        return {
          status: 200,
          body: calls % 2 === 1 ? CHAPTERS_PAGE1_JSON : CHAPTERS_PAGE2_JSON,
          contentType: 'application/json',
        };
      };
    })(),
  );
  http.register((url) => url.includes('/api/v2/titles/chapters/9') && url.endsWith('/'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/api/v2/titles/one-piece/`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/api/v2/search`), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('Remanga parser conformance', () => {
  const http = setUpFixtures();
  const parser = createRemangaParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.REMANGA);
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
    expect(item!.year).toBe(1997);
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения', 'Веб']);
    expect(item!.translationState).toBe('ongoing');
    expect(item!.likes).toBe(1432);
    expect(item!.views).toBe(4234);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      expect(chapter.branch).toBe('TeamA, TeamB');
    }
    expect(manga.chapters!.map((c) => [c.volume, c.number])).toEqual(
      expect.arrayContaining([
        [1, 1],
        [1, 2],
      ]),
    );
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения', 'Веб']);
    expect(manga.type).toBe(TITLE_TYPE.MANGA);
    expect(manga.year).toBe(1997);
    expect(manga.artists).toEqual(['Oda Eiichiro']);
    expect(manga.publishers).toEqual(['Shueisha']);
    expect(manga.translators).toEqual(['TeamA', 'TeamB']);
    expect(manga.translationState).toBe('ongoing');
    expect(manga.votesCount).toBe(57);
    expect(manga.likes).toBe(1432);
    expect(manga.views).toBe(4234);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    const chapter1 = manga.chapters!.find((c) => c.number === 1)!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://cdn.remanga.example/001.jpg');
  });

  it('getFilters: genre/category fetched live, the rest hardcoded, plus three RANGE groups', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      REMANGA_FILTER_GROUP.GENRE,
      REMANGA_FILTER_GROUP.CATEGORY,
      REMANGA_FILTER_GROUP.TYPE,
      REMANGA_FILTER_GROUP.STATUS,
      REMANGA_FILTER_GROUP.TRANSLATE_STATUS,
      REMANGA_FILTER_GROUP.AGE_RATING,
      REMANGA_FILTER_GROUP.RATING,
      REMANGA_FILTER_GROUP.YEAR,
      REMANGA_FILTER_GROUP.CHAPTERS_COUNT,
    ]);

    const genre = groups.find((g) => g.id === REMANGA_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(genre.options).toEqual([
      { key: '1', title: 'Приключения', count: null },
      { key: '3', title: 'Боевые искусства', count: null },
    ]);

    const category = groups.find((g) => g.id === REMANGA_FILTER_GROUP.CATEGORY)!;
    expect(category.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(category.options).toEqual([
      { key: '5', title: 'Веб', count: null },
      { key: '47', title: 'Алхимия', count: null },
    ]);

    const status = groups.find((g) => g.id === REMANGA_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options.length).toBeGreaterThan(0);

    const rating = groups.find((g) => g.id === REMANGA_FILTER_GROUP.RATING)!;
    expect(rating.type).toBe(FILTER_TYPE.RANGE);
    expect(rating.options).toEqual([]);
    expect(rating.settings?.range).toEqual({ min: 0, max: 10, step: 0.1 });
    expect(rating.settings?.presets).toEqual([
      { id: '9-plus', label: '9+', min: 9 },
      { id: '8-plus', label: '8+', min: 8 },
      { id: '7-plus', label: '7+', min: 7 },
    ]);

    const year = groups.find((g) => g.id === REMANGA_FILTER_GROUP.YEAR)!;
    expect(year.type).toBe(FILTER_TYPE.RANGE);
    expect(year.settings?.range).toMatchObject({ min: 1900, format: 'year' });
    expect(year.settings?.presets?.[0]).toMatchObject({ id: 'current-year' });
    expect(year.settings?.presets?.at(-1)).toEqual({
      id: 'before-2000',
      label: 'Раньше 2000',
      min: 1900,
      max: 1999,
    });

    const chaptersCount = groups.find((g) => g.id === REMANGA_FILTER_GROUP.CHAPTERS_COUNT)!;
    expect(chaptersCount.type).toBe(FILTER_TYPE.RANGE);
    expect(chaptersCount.settings?.range).toEqual({ min: 0, max: 2000 });
    expect(chaptersCount.settings?.presets).toEqual([
      { id: 'lt-20', label: '< 20', max: 20 },
      { id: 'lt-50', label: '< 50', max: 50 },
      { id: '100-200', label: '100-200', min: 100, max: 200 },
      { id: '200-300', label: '200-300', min: 200, max: 300 },
      { id: '300-plus', label: '300+', min: 300 },
    ]);
  });

  it('getList with filters: genre/category/type exclude routes through exclude_*, ranges through _gte/_lte', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: REMANGA_FILTER_GROUP.GENRE, key: '1' },
        { groupId: REMANGA_FILTER_GROUP.GENRE, key: '3', exclude: true },
        { groupId: REMANGA_FILTER_GROUP.CATEGORY, key: '5', exclude: true },
        { groupId: REMANGA_FILTER_GROUP.STATUS, key: '2' },
        { groupId: REMANGA_FILTER_GROUP.RATING, range: { min: 8 } },
        { groupId: REMANGA_FILTER_GROUP.YEAR, range: { max: 2020 } },
      ],
    });
    const listRequest = http.requests.filter((r) => r.url.includes('/search/catalog')).at(-1)!;
    const url = new URL(listRequest.url);
    expect(url.searchParams.getAll('genres')).toEqual(['1']);
    expect(url.searchParams.getAll('exclude_genres')).toEqual(['3']);
    expect(url.searchParams.getAll('exclude_categories')).toEqual(['5']);
    expect(url.searchParams.getAll('status')).toEqual(['2']);
    expect(url.searchParams.get('rating_gte')).toBe('8');
    expect(url.searchParams.get('issue_year_lte')).toBe('2020');
  });
});

describe('Remanga getHome', () => {
  const sliderTitle = (dir: string) => ({
    title: {
      dir,
      main_name: dir,
      avg_rating: '7.5',
      cover: { mid: `/covers/${dir}.jpg` },
      type: { id: 1 },
    },
  });

  it('maps every described section in order, string ratings scaled to 0..1', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url.includes('/api/v3/titles/?slider_type=hot_new'), {
      status: 200,
      body: JSON.stringify({ results: [sliderTitle('hot').title] }),
      contentType: 'application/json',
    });
    http.register((url) => url.endsWith('/api/v2/titles/sliders/35/'), {
      status: 404,
      body: '{}',
      contentType: 'application/json',
    });
    http.register((url) => url.includes('/api/v2/titles/sliders/'), {
      status: 200,
      body: JSON.stringify({ titles: [sliderTitle('slide')] }),
      contentType: 'application/json',
    });
    const parser = createRemangaParser(makeContext(http));

    const sections = await parser.getHome!();

    expect(sections.map(({ id }) => id)).toEqual(parser.info.homeSections.map(({ id }) => id));
    expect(sections[0]?.items[0]?.url).toBe('/manga/hot');
    expect(sections[0]?.items[0]?.rating).toBeCloseTo(0.75);
    expect(sections[0]?.items[0]?.chapters).toBeNull();
    // «В тренде» не ответил — пустой блок, остальные на месте.
    expect(sections.find(({ id }) => id === 'trending')?.items).toEqual([]);
    expect(sections.find(({ id }) => id === 'popular')?.items).toHaveLength(1);
  });

  it('throws when every section failed', async () => {
    const http = new FakeHttpClient();
    http.register(() => true, { status: 500, body: '', contentType: 'application/json' });
    const parser = createRemangaParser(makeContext(http));

    await expect(parser.getHome!()).rejects.toThrow();
  });
});

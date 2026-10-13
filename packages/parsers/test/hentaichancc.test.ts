import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
} from '@tanuki/contracts';
import type { SortOrder } from '@tanuki/contracts';
import { createHentaichanCcParser, HENTAICHAN_CC_FILTER_GROUP } from '../src/sources/hentaichancc';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { checkHome } from './support/home';

const DOMAIN = 'hentaichan.cc';
const API_BASE = 'https://backend.hentaichan.cc';
const CDN_BASE = 'https://cdn.hentaichan.cc';

const LIST_RESPONSE = JSON.stringify({
  data: [
    {
      id: 5243,
      name: '1 + 2 (Ato no Futari)',
      slug: '1-2-ato-no-futari',
      cover: { filename_disk: '4e209016-3118-4381-bc99-722f25beca24.jpg' },
      description: 'Краткое описание.',
      tags: [{ tags_id: { name: 'ahegao', slug: 'ahegao' } }],
      type: 'doujinshi',
      likes: 128,
      views: 3400,
      pages: 24,
      date_created: '2025-06-14T10:00:00.000Z',
    },
  ],
});

const DETAILS_RESPONSE = JSON.stringify({
  data: [
    {
      id: 5243,
      name: '1 + 2 (Ato no Futari)',
      slug: '1-2-ato-no-futari',
      cover: { filename_disk: '4e209016-3118-4381-bc99-722f25beca24.jpg' },
      description: 'Описание тайтла.',
      russian_name: null,
      english_name: '1 + 2',
      romaji_name: 'Ato no Futari',
      tags: [{ tags_id: { name: 'ahegao', slug: 'ahegao' } }],
      authors: [{ authors_id: { name: 'Satomi' } }],
      translators: [{ translators_id: { name: 'Degrad' } }],
      series: [{ series_id: { name: 'Sword Art Online' } }, { series_id: null }],
      type: 'comix',
      likes: 128,
      views: 3400,
      pages: 24,
      date_created: '2025-06-14T10:00:00.000Z',
    },
  ],
});

const CHAPTERS_RESPONSE = JSON.stringify({
  data: [{ id: 5206 }, { id: 5300 }],
});

const TAGS_RESPONSE = JSON.stringify({
  data: [
    { name: 'ahegao', slug: 'ahegao' },
    { name: 'футанари', slug: 'futanari' },
  ],
});

const SERIES_RESPONSE = JSON.stringify({
  data: [{ name: 'Оригинальные работы', slug: 'originalnye-raboty' }],
});

const AUTHORS_DICTIONARY_RESPONSE = JSON.stringify({
  data: [{ name: 'Lewdua', slug: 'lewdua' }],
});

const TRANSLATORS_RESPONSE = JSON.stringify({
  data: [{ name: 'Degrad', slug: 'degrad' }],
});

const RANGE_BOUNDS_RESPONSE = JSON.stringify({
  data: [
    {
      min: { date_created: '2025-04-02T13:00:24.215Z', views: 0, likes: 0, pages: 0 },
      max: { date_created: '2026-09-01T18:20:06.025Z', views: 4377167, likes: 17475, pages: 100 },
    },
  ],
});

const PAGES_RESPONSE = JSON.stringify({
  data: {
    id: 5206,
    pages: [
      { directus_files_id: { filename_disk: 'c3f9958e-81f9-400f-a9c9-fa1145b5041f.webp' } },
      { directus_files_id: { filename_disk: '14e6522e-374b-4b28-b5c0-8603534afd40.webp' } },
    ],
  },
});

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
  http.register((url) => url.startsWith(`${API_BASE}/items/tags`), {
    status: 200,
    body: TAGS_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`${API_BASE}/items/series`), {
    status: 200,
    body: SERIES_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`${API_BASE}/items/authors`), {
    status: 200,
    body: AUTHORS_DICTIONARY_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`${API_BASE}/items/translators`), {
    status: 200,
    body: TRANSLATORS_RESPONSE,
    contentType: 'application/json',
  });
  http.register(
    (url) => url.startsWith(`${API_BASE}/items/manga`) && url.includes('aggregate%5Bmin%5D'),
    { status: 200, body: RANGE_BOUNDS_RESPONSE, contentType: 'application/json' },
  );
  http.register((url) => url.startsWith(`${API_BASE}/items/chapters/5206`), {
    status: 200,
    body: PAGES_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`${API_BASE}/items/chapters`), {
    status: 200,
    body: CHAPTERS_RESPONSE,
    contentType: 'application/json',
  });
  http.register(
    (url) => url.startsWith(`${API_BASE}/items/manga`) && url.includes('filter%5Bid%5D'),
    { status: 200, body: DETAILS_RESPONSE, contentType: 'application/json' },
  );
  http.register((url) => url.startsWith(`${API_BASE}/items/manga`), {
    status: 200,
    body: LIST_RESPONSE,
    contentType: 'application/json',
  });
  return http;
};

describe('HentaiChan.cc parser conformance', () => {
  const http = setUpFixtures();
  const parser = createHentaichanCcParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.HENTAICHAN_CC);
    expect(item!.rating).toBe(-1);
    expect(item!.contentRating).toBe(CONTENT_RATING.ADULT);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toBe('https://hentaichan.cc/manga/1-2-ato-no-futari');
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.coverUrl).toBe(`${CDN_BASE}/4e209016-3118-4381-bc99-722f25beca24.jpg`);
  });

  it('getList: derives type/year/likes/pages from the raw fields', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    const [item] = items;
    // 'doujinshi' has no dedicated TITLE_TYPE bucket — folds into MANGA.
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
    expect(item!.year).toBe(2025);
    expect(item!.likes).toBe(128);
    expect(item!.views).toBe(3400);
    expect(item!.pages).toBe(24);
    expect(item!.description).toBe('Краткое описание.');
    expect(item!.tags.map((t) => t.title)).toEqual(['Ahegao']);
    // 'doujinshi' folds into TITLE_TYPE.MANGA, but the original format survives here.
    expect(item!.releaseFormats).toEqual(['Додзинси']);
    expect(item!.addedAt).toBe(new Date('2025-06-14T10:00:00.000Z').getTime());
  });

  it('getList: sort maps order to field, direction to a `-` prefix', async () => {
    const cases: [SortOrder | undefined, string | undefined, string][] = [
      [undefined, undefined, '-date_created'],
      [SORT_ORDER.RELEASED, SORT_DIRECTION.ASC, 'date_created'],
      [SORT_ORDER.UPDATED, undefined, '-date_updated'],
      [SORT_ORDER.UPDATED, SORT_DIRECTION.ASC, 'date_updated'],
      [SORT_ORDER.POPULARITY, undefined, '-views'],
      [SORT_ORDER.RATING, undefined, '-likes'],
      [SORT_ORDER.PAGES, undefined, '-pages'],
    ];
    for (const [order, direction, expected] of cases) {
      const fresh = setUpFixtures();
      await createHentaichanCcParser(makeContext(fresh)).getList({
        offset: 0,
        limit: 20,
        order,
        direction,
      });
      const url = new URL(fresh.requests[0]!.url);
      expect(url.searchParams.get('sort')).toBe(expected);
    }
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('5243,,1-2-ato-no-futari');
    const addedAt = new Date('2025-06-14T10:00:00.000Z').getTime();
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      // The `chapters` collection carries no date field of its own — every chapter is stamped
      // with its manga's own date_created.
      expect(chapter.uploadDate).toBe(addedAt);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.altTitles).toEqual(['1 + 2', 'Ato no Futari']);
    expect(manga.tags.map((t) => t.title)).toEqual(['Ahegao']);
    expect(manga.authors).toEqual(['Satomi']);
    expect(manga.translators).toEqual(['Degrad']);
    expect(manga.series).toEqual(['Sword Art Online']);
    expect(manga.type).toBe(TITLE_TYPE.COMICS);
    expect(manga.year).toBe(2025);
    expect(manga.likes).toBe(128);
    expect(manga.views).toBe(3400);
    expect(manga.pages).toBe(24);
    expect(manga.releaseFormats).toEqual(['Комикс']);
    expect(manga.addedAt).toBe(addedAt);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('5243,,1-2-ato-no-futari');
    const pages = await parser.getPages(manga.chapters![0]!.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`${CDN_BASE}/c3f9958e-81f9-400f-a9c9-fa1145b5041f.webp`);
  });

  it('getFilters: tag/series/author/translator SEARCHABLE_CHECKBOX, type CHECKBOX, views/likes/pages/year RANGE', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      HENTAICHAN_CC_FILTER_GROUP.TAG,
      HENTAICHAN_CC_FILTER_GROUP.TYPE,
      HENTAICHAN_CC_FILTER_GROUP.SERIES,
      HENTAICHAN_CC_FILTER_GROUP.AUTHOR,
      HENTAICHAN_CC_FILTER_GROUP.TRANSLATOR,
      HENTAICHAN_CC_FILTER_GROUP.VIEWS,
      HENTAICHAN_CC_FILTER_GROUP.LIKES,
      HENTAICHAN_CC_FILTER_GROUP.PAGES,
      HENTAICHAN_CC_FILTER_GROUP.YEAR,
    ]);

    const tag = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.TAG)!;
    expect(tag.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX);
    expect(tag.options).toEqual([
      { key: 'ahegao', title: 'Ahegao', count: null },
      { key: 'futanari', title: 'Футанари', count: null },
    ]);

    const type = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.TYPE)!;
    expect(type.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(type.options.map((o) => o.key)).toEqual(['manga', 'doujinshi', 'comix']);

    const series = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.SERIES)!;
    expect(series.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX);
    expect(series.options).toEqual([
      { key: 'originalnye-raboty', title: 'Оригинальные Работы', count: null },
    ]);

    const author = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.AUTHOR)!;
    expect(author.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX);
    expect(author.options).toEqual([{ key: 'lewdua', title: 'Lewdua', count: null }]);

    const translator = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.TRANSLATOR)!;
    expect(translator.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX);
    expect(translator.options).toEqual([{ key: 'degrad', title: 'Degrad', count: null }]);

    const views = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.VIEWS)!;
    expect(views.type).toBe(FILTER_TYPE.RANGE);
    expect(views.settings?.range).toEqual({ min: 0, max: 4377167 });
    expect(views.settings?.presets?.length).toBeGreaterThan(0);

    const likes = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.LIKES)!;
    expect(likes.type).toBe(FILTER_TYPE.RANGE);
    expect(likes.settings?.range).toEqual({ min: 0, max: 17475 });
    expect(likes.settings?.presets?.length).toBeGreaterThan(0);

    const pages = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.PAGES)!;
    expect(pages.type).toBe(FILTER_TYPE.RANGE);
    expect(pages.settings?.range).toEqual({ min: 0, max: 100 });
    expect(pages.settings?.presets?.length).toBeGreaterThan(0);

    const year = groups.find((g) => g.id === HENTAICHAN_CC_FILTER_GROUP.YEAR)!;
    expect(year.type).toBe(FILTER_TYPE.RANGE);
    expect(year.settings?.range).toMatchObject({ min: 2025, max: 2026, format: 'year' });
  });

  it('getList with filters: relations comma-joined, ranges become gte/lte, year becomes date bounds', async () => {
    const fresh = setUpFixtures();
    await createHentaichanCcParser(makeContext(fresh)).getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: HENTAICHAN_CC_FILTER_GROUP.TAG, key: 'ahegao' },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.TAG, key: 'futanari' },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.TYPE, key: 'doujinshi' },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.SERIES, key: 'originalnye-raboty' },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.AUTHOR, key: 'lewdua' },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.TRANSLATOR, key: 'degrad' },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.VIEWS, range: { min: 1000, max: 2000 } },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.LIKES, range: { min: 100 } },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.PAGES, range: { max: 50 } },
        { groupId: HENTAICHAN_CC_FILTER_GROUP.YEAR, range: { min: 2025, max: 2026 } },
      ],
    });
    const url = new URL(fresh.requests[0]!.url);
    expect(url.searchParams.get('filter[tags][tags_id][slug][_in]')).toBe('ahegao,futanari');
    expect(url.searchParams.get('filter[type][_in]')).toBe('doujinshi');
    expect(url.searchParams.get('filter[series][series_id][slug][_in]')).toBe('originalnye-raboty');
    expect(url.searchParams.get('filter[authors][authors_id][slug][_in]')).toBe('lewdua');
    expect(url.searchParams.get('filter[translators][translators_id][slug][_in]')).toBe('degrad');
    expect(url.searchParams.get('filter[views][_gte]')).toBe('1000');
    expect(url.searchParams.get('filter[views][_lte]')).toBe('2000');
    expect(url.searchParams.get('filter[likes][_gte]')).toBe('100');
    expect(url.searchParams.get('filter[likes][_lte]')).toBeNull();
    expect(url.searchParams.get('filter[pages][_lte]')).toBe('50');
    expect(url.searchParams.get('filter[pages][_gte]')).toBeNull();
    expect(url.searchParams.get('filter[date_created][_gte]')).toBe('2025-01-01');
    expect(url.searchParams.get('filter[date_created][_lte]')).toBe('2026-12-31');
  });

  it('getList: always excludes declined/moderation test rows', async () => {
    const fresh = setUpFixtures();
    await createHentaichanCcParser(makeContext(fresh)).getList({ offset: 0, limit: 20 });
    const url = new URL(fresh.requests[0]!.url);
    expect(url.searchParams.get('filter[status][_nin]')).toBe('declined,moderation');
  });
});

describe('HentaiChan.cc getHome', () => {
  // Разметка главной урезана до блока «Популярная манга»: заголовок в своей строке, лента —
  // соседом на уровень выше, как на живой странице.
  const HOME_HTML = `<!doctype html><html><body>
    <div><div><div><h2>Популярная манга</h2></div></div>
      <div>
        <a href="/manga/1-2-ato-no-futari"><img src="x.jpg"></a>
        <a href="/manga/1-2-ato-no-futari">1 + 2</a>
        <a href="/manga/missing-title"><img src="y.jpg"></a>
      </div>
    </div>
  </body></html>`;

  it('«Новая манга» from the catalog, «Популярная манга» in the page order via the API', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${DOMAIN}/`, { status: 200, body: HOME_HTML });
    http.register((url) => url.startsWith(`${API_BASE}/items/manga?`), {
      status: 200,
      body: LIST_RESPONSE,
      contentType: 'application/json',
    });
    const parser = createHentaichanCcParser(makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);

    expect(sections[1]!.items.map(({ url }) => url)).toEqual(['5243,,1-2-ato-no-futari']);
    const popularRequest = http.requests.find(({ url }) => url.includes('filter%5Bslug%5D'));
    expect(decodeURIComponent(popularRequest!.url)).toContain(
      'filter[slug][_in]=1-2-ato-no-futari,missing-title',
    );
  });
});

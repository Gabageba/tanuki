import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createGroupleParser } from '../src/sources/grouple/engine';
import type { GroupleConfig } from '../src/sources/grouple/config';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'mintmanga.example';

const CFG: GroupleConfig = {
  id: 'MINTMANGA',
  siteId: 2,
  authGateway: '3.grouple.co',
  isNsfw: false,
};

const CATALOG_JSON = JSON.stringify({
  total: 1,
  limit: 50,
  offset: 0,
  list: [
    {
      elementId: { linkName: 'One-Piece', siteId: 2 },
      name: 'One Piece',
      picUrl: `https://${DOMAIN}/uploads/one-piece.jpg`,
      category: { id: 1872, typeName: 'category', name: 'Манга' },
      elements: [{ id: 42, typeName: 'genre', name: 'приключения' }],
      translationStatus: 'FINISHED',
      rating: { voteCount: 10, rate: 9.0 },
      chaptersCount: 1057,
    },
  ],
});

const DETAILS_HTML = `<!doctype html><html><head>
  <link rel="canonical" href="https://${DOMAIN}/One-Piece" />
  <meta name="name" content="Ван-Пис" />
</head><body>
  <div id="mangaBox">
    <div class="leftContent">
      <div class="subject-cover"><img src="/img/cover.jpg" /></div>
      <div class="subject-meta">
        <a class="element-link" href="/list/genre/action">приключения</a>
        <a class="element-link" href="/list/genre/comedy">комедия</a>
      </div>
      <div class="elem_author"><a class="person-link" href="/authors/oda">Oda Eiichiro</a></div>
      <div class="manga-description">Описание тайтла.</div>
    </div>
  </div>
  <table id="chapters-list"><tbody>
    <tr class="item-row" data-vol="1" data-num="20">
      <td><a class="chapter-link" href="/One-Piece/vol1/2">Глава 2</a></td>
      <td class="date" data-date="02.01.24">02.01.24</td>
    </tr>
    <tr class="item-row" data-vol="1" data-num="10">
      <td><a class="chapter-link" href="/One-Piece/vol1/1">Глава 1</a></td>
      <td class="date" data-date="01.01.24">01.01.24</td>
    </tr>
  </tbody></table>
  <script>window.user_hash = 'abc123';</script>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <script>
    rm_h.readerInit( info, [["", "", "001.jpg", 800, 1200, ""], ["", "", "002.jpg", 800, 1200, ""]], true, [{"path":"https://${DOMAIN}/"}], false);
  </script>
</body></html>`;

const ADVANCED_SEARCH_HTML = `<!doctype html><html><body>
  <script>
    window.__FILTERS = {};
    window.__FILTERS.sortType = {"RATING":"по популярности","NAME":"по алфавиту"};
    window.__FILTERS.productionStatus = {"PLANNED":"Запланирован","PROGRESS":"Продолжается","FINISHED":"Завершён"};
    window.__FILTERS.translationStatus = {"NONE":"Отсутствует","STARTED":"Начат","FINISHED":"Завершён"};
    window.__FILTERS.searchFilters = {"HIGH_RATE":"Высокий рейтинг","MATURE":"Для взрослых"};
    window.__FILTERS.years = { min: 1957, max: 2027 };
    window.__FILTERS.genre = {"1346":"боевик","1334":"боевые искусства"};
    window.__FILTERS.category = {"6637":"OEL-манга","2741":"Ёнкома"};
    window.__FILTERS.limitation = {"3969":"NC-17","7077":"PG"};
    window.__FILTERS.another = {"7235":"Анимация","4614":"В цвете"};
  </script>
</body></html>`;

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
  http.register((url) => url.includes('/api/catalog/search?'), {
    status: 200,
    body: CATALOG_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.endsWith('/One-Piece') || url.endsWith('/One-Piece?'), {
    status: 200,
    body: DETAILS_HTML,
  });
  http.register((url) => url.includes('/vol1/1'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/search/advanced'), {
    status: 200,
    body: ADVANCED_SEARCH_HTML,
  });
  return http;
};

describe('Grouple parser conformance', () => {
  const http = setUpFixtures();
  const parser = createGroupleParser(CFG, makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MINTMANGA');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.9, 5);
    expect(item!.tags.map((t) => t.key)).toEqual(['42']);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.state).toBe('FINISHED');
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(item!.type).toBe('MANGA');
    expect(item!.chaptersCount).toBe(1057);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/One-Piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThan(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.title).toBe('Ван-Пис');
    expect(manga.tags.map((t) => t.title).sort()).toEqual(['Комедия', 'Приключения']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/One-Piece');
    const chapter1 = manga.chapters!.find((c) => c.url.includes('/vol1/1'))!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/001.jpg`);
  });

  it('getFilters: parses every window.__FILTERS axis, ids as option keys', async () => {
    const groups = await parser.getFilters!();
    const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

    expect(byId.genre!.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(byId.genre!.options).toContainEqual({ key: '1346', title: 'боевик', count: null });
    expect(byId.category!.options).toContainEqual({ key: '6637', title: 'OEL-манга', count: null });
    expect(byId.ageRating!.options).toContainEqual({ key: '3969', title: 'NC-17', count: null });
    expect(byId.misc!.options).toContainEqual({ key: '7235', title: 'Анимация', count: null });
    expect(byId.productionStatus!.options).toContainEqual({
      key: 'FINISHED',
      title: 'Завершён',
      count: null,
    });
    expect(byId.translationStatus!.options).toContainEqual({
      key: 'STARTED',
      title: 'Начат',
      count: null,
    });
    expect(byId.searchFilter!.type).toBe('CHECKBOX_EXCLUDE');
    expect(byId.searchFilter!.options).toContainEqual({
      key: 'MATURE',
      title: 'Для взрослых',
      count: null,
    });
    expect(byId.year!.type).toBe('RANGE');
    expect(byId.year!.settings!.range).toEqual({ min: 1957, max: 2027, format: 'YEAR' });
    expect(byId.year!.settings!.presets![0]).toEqual({
      id: 'current-year',
      label: 'Текущий год',
      min: 2027,
      max: 2027,
    });
    expect(byId.year!.settings!.presets!.at(-1)).toEqual({
      id: 'before-2000',
      label: 'Раньше 2000',
      min: 1957,
      max: 1999,
    });
  });

  it('getFilters: cached across calls (single fetch)', async () => {
    const requestsBefore = http.requests.length;
    await parser.getFilters!();
    await parser.getFilters!();
    expect(http.requests.length).toBe(requestsBefore);
  });

  it('getList: element include/exclude, status axes, searchFilter include/exclude and year range all reach the request', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'genre', key: '1346' },
        { groupId: 'genre', key: '1334', exclude: true },
        { groupId: 'category', key: '6637' },
        { groupId: 'productionStatus', key: 'FINISHED' },
        { groupId: 'translationStatus', key: 'STARTED', exclude: true },
        { groupId: 'searchFilter', key: 'HIGH_RATE' },
        { groupId: 'searchFilter', key: 'MATURE', exclude: true },
        { groupId: 'year', range: { min: 2010, max: 2020 } },
      ],
    });
    const req = http.requests.findLast((r) => r.url.includes('/api/catalog/search?'))!;
    const url = new URL(req.url);
    expect(url.searchParams.getAll('includeElementIds')).toEqual(['1346', '6637']);
    expect(url.searchParams.getAll('excludeElementIds')).toEqual(['1334']);
    expect(url.searchParams.getAll('includeProductionStatuses')).toEqual(['FINISHED']);
    expect(url.searchParams.getAll('excludeTranslationStatuses')).toEqual(['STARTED']);
    expect(url.searchParams.getAll('includeSearchFilter')).toEqual(['HIGH_RATE']);
    expect(url.searchParams.getAll('excludeSearchFilter')).toEqual(['MATURE']);
    expect(url.searchParams.get('years')).toBe('2010,2020');
  });

  it('getList: no filters falls back to the default full year range', async () => {
    await parser.getList({ offset: 0, limit: 20 });
    const req = http.requests.findLast((r) => r.url.includes('/api/catalog/search?'))!;
    const url = new URL(req.url);
    expect(url.searchParams.get('years')).toBe('1900,2100');
    expect(url.searchParams.has('includeElementIds')).toBe(false);
  });
});

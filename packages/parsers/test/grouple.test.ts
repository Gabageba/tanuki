import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { FILTER_TYPE, MANGA_STATE, MANGA_TYPE } from '@tanuki/contracts';
import { createGroupleParser } from '../src/sources/grouple/engine';
import { GROUPLE_FILTER_GROUP } from '../src/sources/grouple/models';
import type { GroupleConfig } from '../src/sources/grouple/config';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'mintmanga.example';

const CFG: GroupleConfig = {
  id: SOURCE_ID.MINTMANGA,
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
      elements: [
        { id: 42, typeName: 'genre', name: 'приключения' },
        { id: 99, typeName: 'year', name: '1997' },
      ],
      translationStatus: 'FINISHED',
      rating: { voteCount: 10, rate: 9.0 },
      chaptersCount: 1057,
    },
  ],
});

const DETAILS_HTML = `<!doctype html><html><head>
  <link rel="canonical" href="/One-Piece" />
  <meta name="name" content="Ван-Пис" />
</head><body>
  <div id="mangaBox">
    <div class="cr-hero-rating" data-toggle="modal" data-target="#rate-modal">
      <div class="cr-hero-rating__item cr-hero-rating__item--main cr-hero-rating__item--full">
        <strong class="cr-hero-rating__value" data-rating-status="positive">8.6</strong>
        <div class="cr-hero-rating__text">36 оценок</div>
      </div>
      <div class="cr-hero-rating__item cr-hero-rating__item--user cr-hero-rating__item--full">
        <strong class="cr-hero-rating__value">-</strong>
      </div>
    </div>
    <div class="leftContent">
      <div class="subject-cover"><img src="/img/cover.jpg" /></div>
      <div class="subject-meta">
        <a class="element-link" href="/list/genre/action">приключения</a>
        <a class="element-link" href="/list/genre/comedy">комедия</a>
      </div>
      <div class="elem_author"><a class="person-link" href="/authors/oda">Oda Eiichiro</a></div>
      <div class="elem_illustrator"><a class="person-link" href="/authors/oda">Oda Eiichiro</a></div>
      <div class="elem_publisher"><a class="element-link" href="/list/publisher/shueisha">Shueisha</a></div>
      <div class="elem_gournal"><a class="element-link" href="/list/gournal/shonen-jump">Shonen Jump</a></div>
      <div class="elem_year"><a class="element-link" href="/list/year/1997">1997</a></div>
      <div class="manga-description">Описание тайтла.</div>
    </div>
    <div class="cr-hero-short-details">
      <div class="cr-hero-short-details__item"><a href="/list/category/manhwa" class="element-link">Манхва</a></div>
      <a class="cr-hero-short-details__item" href="/list/year/1997">1997 г.</a>
    </div>
    <div class="cr-info-details">
      <div class="cr-info-details-item">
        <div class="cr-info-details-item__title">Выпуск</div>
        <div class="cr-info-details-item__content">
          <span class="cr-info-details-item__status" data-production-status="FINISHED">Завершён</span>
        </div>
      </div>
      <div class="cr-info-details-item">
        <div class="cr-info-details-item__title">Перевод</div>
        <div class="cr-info-details-item__content">
          <span class="cr-info-details-item__status" data-translation-status="PROGRESS">Продолжается</span>
        </div>
      </div>
    </div>
    <div class="creation-element-tags">
      <a class="creation-element-tags__item creation-element-tags__item--misc" href="/list/another/color"><span>В цвете</span></a>
      <a class="creation-element-tags__item creation-element-tags__item--misc" href="/list/another/web"><span>Веб</span></a>
    </div>
    <div class="cr-main-persons">
      <div class="cr-main-person-item">
        <div class="cr-main-person-item__role">Сценарист</div>
        <span class="cr-main-person-item__name"><a href="/list/person/kishimoto">Kishimoto</a></span>
      </div>
      <div class="cr-main-person-item">
        <div class="cr-main-person-item__role">Художник</div>
        <span class="cr-main-person-item__name"><a href="/list/person/toriyama">Toriyama</a></span>
      </div>
      <div class="cr-main-person-item">
        <div class="cr-main-person-item__role">Основной переводчик</div>
        <span class="cr-main-person-item__name"><a href="/list/person/mainteam">MainTeam</a></span>
      </div>
    </div>
    <div class="cr-info-panel">
      <h4 class="cr-info-panel__title"><span>Количество читателей</span><span><a href="#">12345</a></span></h4>
    </div>
    <div class="cr-teams">
      <a class="cr-team-item"><span class="cr-team-item__name">Team Alpha</span></a>
      <a class="cr-team-item"><span class="cr-team-item__name">Team Beta</span></a>
      <a class="cr-team-item"><span class="cr-team-item__name">Team Gamma</span></a>
    </div>
  </div>
  <table id="chapters-list"><tbody>
    <tr class="item-row" data-vol="1" data-num="20">
      <td><a class="chapter-link" href="/One-Piece/vol1/2" title="Team Alpha (Переводчик)">Глава 2</a></td>
      <td class="date" data-date="02.01.24">02.01.24</td>
    </tr>
    <tr class="item-row" data-vol="1" data-num="10">
      <td><a class="chapter-link" href="/One-Piece/vol1/1" title="Team Beta (Переводчик)">Глава 1</a></td>
      <td class="date" data-date="01.01.24">01.01.24</td>
    </tr>
  </tbody></table>
  <script>window.user_hash = 'abc123';</script>
</body></html>`;

const ZERO_VOTES_DETAILS_HTML = `<!doctype html><html><head>
  <link rel="canonical" href="https://${DOMAIN}/Zero-Rated" />
  <meta name="name" content="Без оценок" />
</head><body>
  <div id="mangaBox">
    <div class="cr-hero-rating">
      <div class="cr-hero-rating__item cr-hero-rating__item--main cr-hero-rating__item--full">
        <strong class="cr-hero-rating__value" data-rating-status="none">0</strong>
        <div class="cr-hero-rating__text">0 оценок</div>
      </div>
    </div>
    <div class="leftContent">
      <div class="subject-cover"><img src="/img/cover.jpg" /></div>
      <div class="manga-description">Описание тайтла.</div>
    </div>
  </div>
  <table id="chapters-list"><tbody>
    <tr class="item-row" data-vol="1" data-num="10">
      <td><a class="chapter-link" href="/Zero-Rated/vol1/1">Глава 1</a></td>
      <td class="date" data-date="01.01.24">01.01.24</td>
    </tr>
  </tbody></table>
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
  http.register((url) => url.endsWith('/Zero-Rated') || url.endsWith('/Zero-Rated?'), {
    status: 200,
    body: ZERO_VOTES_DETAILS_HTML,
  });
  http.register((url) => url.includes('/vol1/1'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/search/advanced'), {
    status: 200,
    body: ADVANCED_SEARCH_HTML,
  });
  return http;
};

const ALLHENTAI_CFG: GroupleConfig = {
  id: SOURCE_ID.ALLHENTAI,
  siteId: 1,
  authGateway: 'z.qawa.org',
  isNsfw: true,
  extraAuthCookies: ['remember_me'],
};

/**
 * AllHentai's `/search/advanced` never migrated to the `window.__FILTERS` JSON template (see
 * engine.ts LEGACY_FORM_FILTER_GROUPS) — it's still the older plain HTML form. Trimmed to one or
 * two options per axis, but the markup shape (hidden `el_`/`s_`/`prod_`/`trans_` inputs, the
 * years range slider) mirrors a live authenticated fetch.
 */
const LEGACY_ADVANCED_SEARCH_HTML = `<!doctype html><html><body>
<form action="/search/advancedResults" class="search-form search-form-advanced" id="advanced">
  <div class="form-group row">
    <div class="col-sm-2 col-form-label">
      <a href="/list/genres/sort_name" target="_blank">Жанры</a>
    </div>
    <div class="col-sm-10">
      <li class="property">
        <input type="hidden" class="hide" name="el_855" value="" id="el_855" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 'el_855')" title="ahegao">ahegao</span></label>
      </li>
      <li class="property">
        <input type="hidden" class="hide" name="el_828" value="" id="el_828" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 'el_828')" title="анал">анал</span></label>
      </li>
    </div>
  </div>
  <div class="form-group row">
    <div class="col-sm-2 col-form-label">
      <a href="/list/categorys/sort_name" target="_blank">Категории</a>
    </div>
    <div class="col-sm-10">
      <li class="property">
        <input type="hidden" class="hide" name="el_6449" value="" id="el_6449" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 'el_6449')" title="Манга">Манга</span></label>
      </li>
    </div>
  </div>
  <div class="form-group row">
    <div class="col-sm-2 col-form-label">Фильтры</div>
    <div class="col-sm-10">
      <li class="property">
        <input type="hidden" class="hide" name="s_high_rate" value="" id="s_high_rate" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 's_high_rate')" title="Высокий рейтинг">Высокий рейтинг</span></label>
      </li>
      <li class="property">
        <input type="hidden" class="hide" name="s_mature" value="" id="s_mature" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 's_mature')" title="Для взрослых">Для взрослых</span></label>
      </li>
    </div>
  </div>
  <div class="form-group row">
    <div class="col-sm-2 col-form-label">Статус выхода</div>
    <div class="col-sm-10">
      <li class="property">
        <input type="hidden" class="hide" name="prod_FINISHED" value="" id="prod_FINISHED" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 'prod_FINISHED')" title="Завершён">Завершён</span></label>
      </li>
    </div>
  </div>
  <div class="form-group row">
    <div class="col-sm-2 col-form-label">Статус перевода</div>
    <div class="col-sm-10">
      <li class="property">
        <input type="hidden" class="hide" name="trans_STARTED" value="" id="trans_STARTED" />
        <label><span class="js-link" onclick="rm_h.search.clickOption(this, 'trans_STARTED')" title="Начат">Начат</span></label>
      </li>
    </div>
  </div>
  <div class="form-group row">
    <div class="col-sm-2 col-form-label">Год выпуска</div>
    <div class="col-sm-10 year-selector">
      <input class="range-input" name="years" type="hidden" value=""
             data-slider-min="1988" data-slider-max="2026" data-slider-value="[1988,2026]" />
    </div>
  </div>
</form>
</body></html>`;

describe('Grouple parser: AllHentai legacy HTML advanced-search form', () => {
  const http = new FakeHttpClient();
  http.register((url) => url.endsWith('/search/advanced'), {
    status: 200,
    body: LEGACY_ADVANCED_SEARCH_HTML,
  });
  http.register((url) => url.includes('/api/catalog/search?'), {
    status: 200,
    body: JSON.stringify({ total: 0, limit: 50, offset: 0, list: [] }),
    contentType: 'application/json',
  });
  const parser = createGroupleParser(ALLHENTAI_CFG, makeContext(http) as unknown as ParserContext);

  it('getFilters: parses genre/category/searchFilter/productionStatus/translationStatus/year off the legacy form', async () => {
    const groups = await parser.getFilters!();
    const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

    expect(groups).toHaveLength(6);
    expect(byId.genre!.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(byId.genre!.options).toEqual([
      { key: '855', title: 'ahegao', count: null },
      { key: '828', title: 'анал', count: null },
    ]);
    expect(byId.category!.options).toEqual([{ key: '6449', title: 'Манга', count: null }]);
    expect(byId.searchFilter!.type).toBe(FILTER_TYPE.CHECKBOX_EXCLUDE);
    expect(byId.searchFilter!.options).toEqual([
      { key: 'HIGH_RATE', title: 'Высокий рейтинг', count: null },
      { key: 'MATURE', title: 'Для взрослых', count: null },
    ]);
    expect(byId.productionStatus!.options).toEqual([
      { key: 'FINISHED', title: 'Завершён', count: null },
    ]);
    expect(byId.translationStatus!.options).toEqual([
      { key: 'STARTED', title: 'Начат', count: null },
    ]);
    expect(byId.ageRating).toBeUndefined();
    expect(byId.misc).toBeUndefined();
    expect(byId.year!.type).toBe(FILTER_TYPE.RANGE);
    expect(byId.year!.settings!.range).toEqual({ min: 1988, max: 2026, format: 'year' });
  });

  it('getFilters: cached across calls (single fetch)', async () => {
    const requestsBefore = http.requests.length;
    await parser.getFilters!();
    await parser.getFilters!();
    expect(http.requests.length).toBe(requestsBefore);
  });

  it('getList: legacy-form filter keys reach includeElementIds/includeSearchFilter unchanged', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: GROUPLE_FILTER_GROUP.GENRE, key: '855' },
        { groupId: GROUPLE_FILTER_GROUP.SEARCH_FILTER, key: 'MATURE' },
      ],
    });
    const req = http.requests.findLast((r) => r.url.includes('/api/catalog/search?'))!;
    const url = new URL(req.url);
    expect(url.searchParams.getAll('includeElementIds')).toEqual(['855']);
    expect(url.searchParams.getAll('includeSearchFilter')).toEqual(['MATURE']);
  });
});

describe('Grouple parser conformance', () => {
  const http = setUpFixtures();
  const parser = createGroupleParser(CFG, makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.MINTMANGA);
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.9, 5);
    expect(item!.tags.map((t) => t.key)).toEqual(['42']);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.releaseState).toBe(MANGA_STATE.FINISHED);
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(item!.type).toBe(MANGA_TYPE.MANGA);
    expect(item!.chaptersCount).toBe(1057);
    expect(item!.year).toBe(1997);
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
    expect(manga.rating).toBeCloseTo(0.86, 5);
  });

  it('getDetails: publicUrl is always absolute, even when the canonical tag is host-relative', async () => {
    const manga = await parser.getDetails('/One-Piece');
    expect(manga.publicUrl).toBe(`https://${DOMAIN}/One-Piece`);
  });

  it('getDetails: illustrator/publisher/journal/year/votes are parsed separately from author', async () => {
    const manga = await parser.getDetails('/One-Piece');
    expect(manga.publishers).toEqual(['Shueisha']);
    expect(manga.magazines).toEqual(['Shonen Jump']);
    expect(manga.year).toBe(1997);
    expect(manga.votesCount).toBe(36);
  });

  it('getDetails: cr-main-persons roles split into authors/artists and exclude translators', async () => {
    const manga = await parser.getDetails('/One-Piece');
    expect(manga.authors).toEqual(['Oda Eiichiro', 'Kishimoto']);
    expect(manga.artists).toEqual(['Oda Eiichiro', 'Toriyama']);
    expect(manga.authors).not.toContain('MainTeam');
    expect(manga.artists).not.toContain('MainTeam');
  });

  it('getDetails: cr-teams supplies the full translator roster, taking precedence over per-chapter scanlators', async () => {
    const manga = await parser.getDetails('/One-Piece');
    expect(manga.translators).toEqual(['Team Alpha', 'Team Beta', 'Team Gamma']);
  });

  it('getDetails: type, release/translation status and release formats come off the new hero layout', async () => {
    const manga = await parser.getDetails('/One-Piece');
    expect(manga.type).toBe(MANGA_TYPE.MANHWA);
    expect(manga.releaseState).toBe(MANGA_STATE.FINISHED);
    expect(manga.translationState).toBe(MANGA_STATE.ONGOING);
    expect(manga.releaseFormats).toEqual(['В цвете', 'Веб']);
    expect(manga.views).toBe(12345);
  });

  it('getDetails: distinct scanlators produce distinct branches', async () => {
    const manga = await parser.getDetails('/One-Piece');
    const branches = new Set(manga.chapters!.map((c) => c.branch));
    expect(branches).toEqual(new Set(['Team Alpha', 'Team Beta']));
  });

  it('getDetails: data-rating-status="none" (0 votes) reports rating as unknown, not 0', async () => {
    const manga = await parser.getDetails('/Zero-Rated');
    expect(manga.rating).toBe(-1);
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

    expect(byId.genre!.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
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
    expect(byId.searchFilter!.type).toBe(FILTER_TYPE.CHECKBOX_EXCLUDE);
    expect(byId.searchFilter!.options).toContainEqual({
      key: 'MATURE',
      title: 'Для взрослых',
      count: null,
    });
    expect(byId.year!.type).toBe(FILTER_TYPE.RANGE);
    expect(byId.year!.settings!.range).toEqual({ min: 1957, max: 2027, format: 'year' });
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
        { groupId: GROUPLE_FILTER_GROUP.GENRE, key: '1346' },
        { groupId: GROUPLE_FILTER_GROUP.GENRE, key: '1334', exclude: true },
        { groupId: GROUPLE_FILTER_GROUP.CATEGORY, key: '6637' },
        { groupId: GROUPLE_FILTER_GROUP.PRODUCTION_STATUS, key: 'FINISHED' },
        { groupId: GROUPLE_FILTER_GROUP.TRANSLATION_STATUS, key: 'STARTED', exclude: true },
        { groupId: GROUPLE_FILTER_GROUP.SEARCH_FILTER, key: 'HIGH_RATE' },
        { groupId: GROUPLE_FILTER_GROUP.SEARCH_FILTER, key: 'MATURE', exclude: true },
        { groupId: GROUPLE_FILTER_GROUP.YEAR, range: { min: 2010, max: 2020 } },
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

import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { FILTER_TYPE, SORT_ORDER } from '@tanuki/contracts';
import { createMultpornParser, MULTPORN_FILTER_GROUP } from '../src/sources/multporn/engine';
import type { MultpornConfig } from '../src/sources/multporn/config';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'multporn.example';

const CFG: MultpornConfig = {
  id: SOURCE_ID.MULTPORN,
  typeParam: '1',
  pathPrefix: '/comics/',
  listTagSelector: '.views-field-field-category a',
  detailTagSelector: '.field-name-field-category a',
  authorSelector: '.field-name-field-author a',
};

const BROWSE_LIST_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <div class="masonry-item views-row">
      <div class="views-field views-field-title"><strong class="field-content"><a href="/comics/one-piece">One Piece</a></strong></div>
      <div class="views-field views-field-field-preview"><div class="field-content"><a href="/comics/one-piece"><img src="/styles/search_comics/public/one-piece-thumb.jpg?itok=abc" /></a></div></div>
      <div class="views-field views-field-field-category"><h5 class="field-content"><a href="/category/adventure">Adventure</a>, <a href="/category/comedy">Comedy</a></h5></div>
      <h4 class="views-field views-field-field-vote"><div class="field-content"><div class="fivestar-summary fivestar-summary-average-count"><span class="average-rating">Average: <span>4.6</span></span> <span class="total-votes">(<span>641</span> votes)</span></div></div></h4>
      <h5 class="views-field views-field-totalcount"><span class="field-content">Views: 941,111</span></h5>
      <h5><span>Date: </span><span>23/04/2024 - 14:47</span></h5>
    </div>
  </div>
</body></html>`;

/** Mixed-type row (a "Games" item) that must be filtered out by \`pathPrefix\`, plus a matching
 *  comics row — models \`/search\`'s single feed spanning every content type. */
const SEARCH_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <div class="masonry-item views-row">
      <div class="views-field views-field-title"><span class="field-content"><a href="/games/some-game">Some Game</a></span></div>
      <div class="views-field views-field-field-games-pre"><span class="field-content"><a href="/games/some-game"><img src="/styles/search/public/game.jpg" /></a></span></div>
    </div>
    <div class="masonry-item views-row">
      <div class="views-field views-field-title"><span class="field-content"><a href="/comics/one-piece">One Piece</a></span></div>
      <div class="views-field views-field-field-preview-1"><span class="field-content"><a href="/comics/one-piece"><img src="/styles/search_comics/public/one-piece-thumb.jpg?itok=abc" /></a></span></div>
      <div class="views-field views-field-field-category"><div class="field-content"><a href="/category/adventure">Adventure</a></div></div>
    </div>
  </div>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><head>
  <meta property="og:image" content="https://${DOMAIN}/styles/juicebox_1500x1500/public/one-piece-cover.jpg?itok=xyz" />
  <meta property="og:description" content="Read One Piece comic for free." />
</head><body>
  <article class="node">
    <h1 class="title" id="page-title">One Piece</h1>
    <div class="content clearfix">
      <div class="field field-name-field-author"><ul class="links"><li><a href="/authors_comics/oda">Oda Eiichiro</a></li></ul></div>
      <div class="field field-name-field-category"><ul class="links"><li><a href="/category/adventure">Adventure</a></li><li><a href="/category/comedy">Comedy</a></li></ul></div>
      <div class="field field-name-field-vote"><div class="field-items"><div class="field-item even"><div class="fivestar-summary fivestar-summary-average-count"><span class="average-rating">Average: <span>4.6</span></span> <span class="total-votes">(<span>641</span> votes)</span></div></div></div></div>
      <div class="field field-name-field-com-pages"><div class="field-items"><div class="field-item even"><div class="juicebox-parent">
        <div class="juicebox-container">
          <noscript>
            <p class="jb-image"><img src="/styles/juicebox_medium/public/one-piece/001.png?itok=aaa" alt="" /><br/></p>
            <p class="jb-image"><img src="/styles/juicebox_medium/public/one-piece/002.png?itok=bbb" alt="" /><br/></p>
          </noscript>
        </div>
      </div></div></div></div>
    </div>
  </article>
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
  http.register((url) => url.includes('/search'), { status: 200, body: SEARCH_HTML });
  http.register((url) => url.includes('/new'), { status: 200, body: BROWSE_LIST_HTML });
  http.register((url) => url.endsWith('/comics/one-piece'), { status: 200, body: DETAILS_HTML });
  return http;
};

describe('MultPorn parser conformance', () => {
  const http = setUpFixtures();
  const parser = createMultpornParser(CFG, makeContext(http));

  it('getList: chapters null, rating/year from the vote+date widgets, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.MULTPORN);
    expect(item!.rating).toBeCloseTo(0.92);
    expect(item!.year).toBe(2024);
    expect(item!.chaptersCount).toBeUndefined();
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('One Piece');
    expect(item!.tags.map((t) => t.title)).toEqual(['Adventure', 'Comedy']);
    expect(item!.coverUrl).toMatch(/^https?:\/\//);
  });

  it('getList with a query: skips rows from other content types found on /search', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, query: 'one piece' });
    expect(items).toHaveLength(1);
    expect(items[0]!.url).toBe('/comics/one-piece');
  });

  it('getList: defaults to sort_by=changed&sort_order=DESC when order/direction are unset', async () => {
    await parser.getList({ offset: 0, limit: 20 });
    const browseRequest = http.requests.findLast((r) => r.url.includes('/new'))!;
    expect(browseRequest.url).toContain('sort_by=changed');
    expect(browseRequest.url).toContain('sort_order=DESC');
  });

  it('getList: maps order=added/direction=asc to sort_by=created&sort_order=ASC', async () => {
    await parser.getList({ offset: 0, limit: 20, order: 'added', direction: 'asc' });
    const browseRequest = http.requests.findLast((r) => r.url.includes('/new'))!;
    expect(browseRequest.url).toContain('sort_by=created');
    expect(browseRequest.url).toContain('sort_order=ASC');
  });

  it('getDetails: single synthetic chapter, cover/description from og: meta, rating and gallery page count, ids unique', async () => {
    const manga = await parser.getDetails('/comics/one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(1);
    expect(manga.chapters![0]!.url).toBe('/comics/one-piece');
    expect(manga.authors).toEqual(['Oda Eiichiro']);
    expect(manga.tags.map((t) => t.title)).toEqual(['Adventure', 'Comedy']);
    expect(manga.description).toBe('Read One Piece comic for free.');
    expect(manga.coverUrl).toBe(
      `https://${DOMAIN}/styles/juicebox_1500x1500/public/one-piece-cover.jpg?itok=xyz`,
    );
    expect(manga.rating).toBeCloseTo(0.92);
    expect(manga.pages).toBe(2);
  });

  it('getPages: absolute, pre-resolved, de-styled (original-file) urls', async () => {
    const pages = await parser.getPages('/comics/one-piece');
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/one-piece/001.png`);
    expect(pages[1]!.url).toBe(`https://${DOMAIN}/one-piece/002.png`);
  });
});

const CFG_HENTAI: MultpornConfig = {
  id: SOURCE_ID.MULTPORN_HENTAI,
  typeParam: '3',
  pathPrefix: '/hentai_manga/',
  listTagSelector: '.views-field-field-h-category a',
  detailTagSelector: '.field-name-field-h-category a',
  authorSelector: '.field-name-field-author-hentai a',
  filters: {
    tagListPath: '/manga_tags?rule34=3',
    tagPathPrefix: '/category_hentai/',
    characterListPath: '/characters_hentai?r=2',
    characterPathPrefix: '/characters_hentai/',
  },
};

/** Modeled on `/manga_tags?rule34=3` page 0 — a `pager-last` pointing at page=1 means one more
 *  page follows. */
const TAG_LIST_PAGE0_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <table class="views-view-grid"><tbody><tr>
      <td><div><strong><a href="/category_hentai/ahegao">Ahegao</a></strong></div></td>
      <td><div><strong><a href="/category_hentai/big_tits">Big tits</a></strong></div></td>
    </tr></tbody></table>
  </div>
  <ul class="pager">
    <li class="pager-item"><a href="/manga_tags?rule34=3&page=1">2</a></li>
    <li class="pager-last last"><a href="/manga_tags?rule34=3&page=1">Last</a></li>
  </ul>
</body></html>`;

/** Page 1 — the last page, no `pager-last` link. */
const TAG_LIST_PAGE1_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <table class="views-view-grid"><tbody><tr>
      <td><div><strong><a href="/category_hentai/cosplay">Cosplay</a></strong></div></td>
    </tr></tbody></table>
  </div>
</body></html>`;

/** Modeled on `/characters_hentai?r=2` — single page, no pager. */
const CHARACTER_LIST_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <table class="views-view-grid"><tbody><tr>
      <td><h5><a href="/characters_hentai/nami">Nami</a></h5></td>
      <td><h5><a href="/characters_hentai/abel">Abel</a></h5></td>
    </tr></tbody></table>
  </div>
</body></html>`;

/** Modeled on `/category_hentai/ahegao` and `/characters_hentai/nami` — a taxonomy-route browse
 *  listing, laid out as `<table class="views-view-grid"><td>` cells rather than `/new`'s masonry
 *  `<div>`s, but with the same `views-field-*` row markup underneath. */
const TAXONOMY_BROWSE_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <table class="views-view-grid cols-2"><tbody><tr>
      <td class="col-1 col-first">
        <div class="views-field views-field-title"><strong class="field-content"><a href="/hentai_manga/ahegao-title">Ahegao Title</a></strong></div>
        <div class="views-field views-field-field-preview"><div class="field-content"><a href="/hentai_manga/ahegao-title"><img src="/styles/taxonomy_comics/public/ahegao-title.jpg?itok=abc" /></a></div></div>
        <div class="views-field views-field-field-h-category"><h5 class="field-content"><a href="/category_hentai/ahegao">Ahegao</a></h5></div>
        <h3 class="views-field views-field-field-vote"><div class="field-content"><span class="average-rating">Average: <span>3.0</span></span></div></h3>
      </td>
    </tr></tbody></table>
  </div>
</body></html>`;

const HENTAI_NEW_HTML = `<!doctype html><html><body>
  <div class="view-content">
    <div class="masonry-item views-row">
      <div class="views-field views-field-title"><strong class="field-content"><a href="/hentai_manga/some-title">Some Title</a></strong></div>
      <div class="views-field views-field-field-preview"><div class="field-content"><a href="/hentai_manga/some-title"><img src="/styles/taxonomy_comics/public/some-title.jpg?itok=abc" /></a></div></div>
      <div class="views-field views-field-field-h-category"><h5 class="field-content"><a href="/category_hentai/ahegao">Ahegao</a></h5></div>
    </div>
  </div>
</body></html>`;

const makeHentaiContext = (http: FakeHttpClient): ParserContext => {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
};

describe('MultPorn Hentai parser filters', () => {
  const setUpHentaiFixtures = (): FakeHttpClient => {
    const http = new FakeHttpClient();
    http.register((url) => url.includes('/manga_tags') && url.includes('page=1'), {
      status: 200,
      body: TAG_LIST_PAGE1_HTML,
    });
    http.register((url) => url.includes('/manga_tags'), {
      status: 200,
      body: TAG_LIST_PAGE0_HTML,
    });
    http.register((url) => url.includes('/characters_hentai?r=2'), {
      status: 200,
      body: CHARACTER_LIST_HTML,
    });
    http.register((url) => url.includes('/category_hentai/'), {
      status: 200,
      body: TAXONOMY_BROWSE_HTML,
    });
    http.register((url) => url.includes('/characters_hentai/nami'), {
      status: 200,
      body: TAXONOMY_BROWSE_HTML,
    });
    http.register((url) => url.includes('/new'), { status: 200, body: HENTAI_NEW_HTML });
    return http;
  };

  it('getFilters: merges paginated tag terms, single-page characters, and static languages', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    const groups = await parser.getFilters!();

    const tag = groups.find((g) => g.id === MULTPORN_FILTER_GROUP.TAG);
    expect(tag?.type).toBe(FILTER_TYPE.SEARCHABLE_RADIO);
    expect(tag?.options.map((o) => o.key)).toEqual(['ahegao', 'big_tits', 'cosplay']);

    const character = groups.find((g) => g.id === MULTPORN_FILTER_GROUP.CHARACTER);
    expect(character?.type).toBe(FILTER_TYPE.SEARCHABLE_RADIO);
    expect(character?.options.map((o) => o.key)).toEqual(['nami', 'abel']);

    const language = groups.find((g) => g.id === MULTPORN_FILTER_GROUP.LANGUAGE);
    expect(language?.type).toBe(FILTER_TYPE.RADIO);
    expect(language?.options.map((o) => o.key)).toEqual(['1', '2', '3', '4', '5']);
    expect(groups.every((g) => g.exclusiveGroup === groups[0]!.exclusiveGroup)).toBe(true);
  });

  it('getFilters: memoizes — a second call issues no further requests', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    await parser.getFilters!();
    const countAfterFirst = http.requests.length;
    await parser.getFilters!();
    expect(http.requests.length).toBe(countAfterFirst);
  });

  it('getList: a tag selection browses /category_hentai/<key> instead of /new', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: MULTPORN_FILTER_GROUP.TAG, key: 'ahegao' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0]!.url).toBe('/hentai_manga/ahegao-title');
    const request = http.requests.findLast((r) => r.url.includes('/category_hentai/'))!;
    expect(request.url).toContain('/category_hentai/ahegao');
    expect(request.url).toContain('sort_by=created');
    expect(request.url).not.toContain('page=');
  });

  it('getList: a character selection browses /characters_hentai/<key> instead of /new', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: MULTPORN_FILTER_GROUP.CHARACTER, key: 'nami' }],
    });
    expect(items).toHaveLength(1);
    const request = http.requests.findLast((r) => r.url.includes('/characters_hentai/nami'))!;
    expect(request.url).toContain('/characters_hentai/nami');
  });

  it('getList: a language selection is forwarded as /new?language=<key>', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: MULTPORN_FILTER_GROUP.LANGUAGE, key: '3' }],
    });
    const request = http.requests.findLast((r) => r.url.includes('/new'))!;
    expect(request.url).toContain('language=3');
  });

  it('getList: with no filters, /new still defaults to language=All', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    await parser.getList({ offset: 0, limit: 20 });
    const request = http.requests.findLast((r) => r.url.includes('/new'))!;
    expect(request.url).toContain('language=All');
  });

  it('getFilters: exposes VIEWS/RATING alongside ADDED/UPDATED, never ALPHABETICAL', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));
    expect(parser.info.sortOrders).toEqual([
      SORT_ORDER.UPDATED,
      SORT_ORDER.ADDED,
      SORT_ORDER.VIEWS,
      SORT_ORDER.RATING,
    ]);
  });

  it('getList: VIEWS/RATING map to totalcount/value when a tag route is active', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));

    await parser.getList({
      offset: 0,
      limit: 20,
      order: SORT_ORDER.VIEWS,
      filters: [{ groupId: MULTPORN_FILTER_GROUP.TAG, key: 'ahegao' }],
    });
    expect(http.requests.findLast((r) => r.url.includes('/category_hentai/'))!.url).toContain(
      'sort_by=totalcount',
    );

    await parser.getList({
      offset: 0,
      limit: 20,
      order: SORT_ORDER.RATING,
      filters: [{ groupId: MULTPORN_FILTER_GROUP.TAG, key: 'ahegao' }],
    });
    expect(http.requests.findLast((r) => r.url.includes('/category_hentai/'))!.url).toContain(
      'sort_by=value',
    );
  });

  it('getList: VIEWS/RATING fall back to sort_by=changed on plain /new browsing', async () => {
    const http = setUpHentaiFixtures();
    const parser = createMultpornParser(CFG_HENTAI, makeHentaiContext(http));

    await parser.getList({ offset: 0, limit: 20, order: SORT_ORDER.VIEWS });
    expect(http.requests.findLast((r) => r.url.includes('/new'))!.url).toContain('sort_by=changed');

    await parser.getList({ offset: 0, limit: 20, order: SORT_ORDER.RATING });
    expect(http.requests.findLast((r) => r.url.includes('/new'))!.url).toContain('sort_by=changed');
  });
});

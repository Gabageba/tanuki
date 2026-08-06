import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createMultpornParser } from '../src/sources/multporn/engine';
import type { MultpornConfig } from '../src/sources/multporn/config';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'multporn.example';

const CFG: MultpornConfig = {
  id: 'MULTPORN',
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

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MULTPORN');
    expect(item!.rating).toBe(-1);
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

  it('getDetails: single synthetic chapter, cover/description from og: meta, ids unique', async () => {
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

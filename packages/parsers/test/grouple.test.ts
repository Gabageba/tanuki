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

const CATALOG_HTML = `<!doctype html><html><body>
  <div id="mangaBox">
    <div class="tiles row">
      <div class="tile">
        <div class="img">
          <a href="/One-Piece"><img class="lazy" data-original="/uploads/one-piece_p.jpg" /></a>
        </div>
        <div class="desc">
          <h3><a href="/One-Piece">One Piece</a></h3>
          <div class="tile-info">
            <a class="person-link" href="/authors/oda">Oda Eiichiro</a>
            <a class="element-link" href="/list/genre/action">приключения</a>
          </div>
        </div>
        <div class="compact-rate" title="4.5"></div>
        <div class="tags"><span class="mangaCompleted"></span></div>
      </div>
    </div>
  </div>
</body></html>`;

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
  http.register((url) => url.includes('/search/advancedResults?'), {
    status: 200,
    body: CATALOG_HTML,
  });
  http.register((url) => url.endsWith('/One-Piece') || url.endsWith('/One-Piece?'), {
    status: 200,
    body: DETAILS_HTML,
  });
  http.register((url) => url.includes('/vol1/1'), { status: 200, body: PAGES_HTML });
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
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.state).toBe('FINISHED');
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
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
});

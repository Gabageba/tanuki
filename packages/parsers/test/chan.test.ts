import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createChanParser } from '../src/sources/chan/engine';
import type { ChanConfig } from '../src/sources/chan/config';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'manga-chan.example';

const CFG: ChanConfig = {
  id: 'MANGACHAN',
  title: 'Манга-тян',
  domains: [DOMAIN],
  isNsfw: false,
  sortOrders: ['NEWEST', 'POPULARITY', 'ALPHABETICAL', 'RATING'],
  variant: 'default',
};

const LIST_HTML = `<!doctype html><html><body>
  <div class="main_fon">
    <div id="content">
      <div class="content_row">
        <div class="manga_row1"><h2><a href="/One-Piece.html">Ван-Пис (One Piece)</a></h2></div>
        <div class="manga_images"><a href="/One-Piece.html"><img src="/uploads/one-piece.jpg" /></a></div>
        <a href="/mangaka/oda">Oda Eiichiro</a>
        <div class="genre"><a href="/tags/priklyucheniya">приключения</a></div>
      </div>
    </div>
  </div>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <div id="dle-content">
    <h1>Ван-Пис (One Piece)</h1>
    <img id="cover" src="/uploads/one-piece-full.jpg" />
    <a href="/mangaka/oda">Oda Eiichiro</a>
    <div class="sidetags"><ul>
      <li class="sidetag"><a href="/tags/priklyucheniya">приключения</a></li>
      <li class="sidetag"><a href="/tags/komediya">комедия</a></li>
    </ul></div>
    <div id="description">Описание тайтла.<div class="share-buttons">social widget junk</div></div>
    <table class="table_cha">
      <tr><td>header1</td></tr>
      <tr><td>header2</td></tr>
      <tr><td><a href="/One-Piece/2.html">Глава 2</a></td><td class="date">2024-01-02</td></tr>
      <tr><td><a href="/One-Piece/1.html">Глава 1</a></td><td class="date">2024-01-01</td></tr>
    </table>
  </div>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <script>
    var pictures = "fullimg"; var arr = ["001.jpg","002.jpg","003.jpg"];
  </script>
</body></html>`;

function makeContext(http: FakeHttpClient): ParserContext {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
}

function setUpFixtures(): FakeHttpClient {
  const http = new FakeHttpClient();
  http.register((url) => url.includes('offset=') && !url.includes('/One-Piece'), {
    status: 200,
    body: LIST_HTML,
  });
  http.register((url) => url.endsWith('/One-Piece.html'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.includes('/One-Piece/2.html'), { status: 200, body: PAGES_HTML });
  return http;
}

describe('Chan parser conformance', () => {
  const http = setUpFixtures();
  const parser = createChanParser(CFG, makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MANGACHAN');
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('One Piece');
    expect(item!.altTitles).toEqual(['Ван-Пис']);
    expect(item!.authors).toEqual(['Oda Eiichiro']);
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/One-Piece.html');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThan(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering: chapter "1" comes before chapter "2"
    expect(manga.chapters![0]!.title).toBe('Глава 1');
    expect(manga.chapters![1]!.title).toBe('Глава 2');
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title).sort()).toEqual(['Комедия', 'Приключения']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/One-Piece.html');
    const chapter2 = manga.chapters!.find((c) => c.title === 'Глава 2')!;
    const pages = await parser.getPages(chapter2.url);
    expect(pages).toHaveLength(3);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/001.jpg`);
  });
});

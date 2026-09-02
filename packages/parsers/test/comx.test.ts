import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { MANGA_STATE } from '@tanuki/contracts';
import { createComxParser } from '../src/sources/comx';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'com-x.example';

const LIST_HTML = `<!doctype html><html><body>
  <div class="readed d-flex short">
    <a class="readed__img img-fit-cover anim" href="/one-piece">
      <img data-src="/covers/one-piece.jpg" />
    </a>
    <h3 class="readed__title"><a href="/one-piece">Ван-Пис / One Piece</a></h3>
  </div>
</body></html>`;

const DATA_JSON = JSON.stringify({
  chapters: [
    { id: 2, posi: 2, title: 'Chapter 2', date: '02.01.2024', volume: 1 },
    { id: 1, posi: 1, title: 'Chapter 1', date: '01.01.2024', volume: 1 },
  ],
  news_id: 555,
});

const DETAILS_HTML = `<!doctype html><html><body>
  <h1>Ван-Пис / One Piece</h1>
  <ul>
    <li>Publisher: Oda Eiichiro</li>
    <li>Release type: Ongoing</li>
  </ul>
  <div class="page__text full-text clearfix">Описание тайтла.</div>
  <script>window.__DATA__ = ${DATA_JSON};</script>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <script>window.__DATA__ = {"images":["001.jpg","002.jpg"]};</script>
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
  http.register((url) => url.includes('/reader/555/2'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/one-piece'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.includes('/ComicList'), { status: 200, body: LIST_HTML });
  return http;
};

describe('Com-X parser conformance', () => {
  const http = setUpFixtures();
  const parser = createComxParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.COMX);
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    // format is "AltTitle / MainTitle" — main title is the second part
    expect(item!.title).toBe('One Piece');
    expect(item!.altTitles).toEqual(['Ван-Пис']);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering after .reverse()
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    expect(manga.state).toBe(MANGA_STATE.ONGOING);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
    expect(manga.description).toBe('Описание тайтла.');
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const pages = await parser.getPages('/reader/555/2');
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://img.com-x.life/comix/001.jpg');
  });
});

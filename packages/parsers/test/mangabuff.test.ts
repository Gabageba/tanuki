import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createMangaBuffParser } from '../src/sources/mangabuff';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'mangabuff.example';

const LIST_HTML = `<!doctype html><html><body>
  <div class="cards">
    <a href="/manga/one-piece" class="cards__item">
      <div class="cards__img" style="background-image: url('/img/manga/posters/one-piece.jpg')"></div>
      <div class="cards__name">Ван-Пис</div>
    </a>
  </div>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <h1>Ван-Пис</h1>
  <div class="manga" data-id="42" data-fav-count="1234"></div>
  <div class="manga__img"><img src="/img/manga/posters/one-piece-full.jpg" /></div>
  <div class="manga__rating">8,7</div>
  <div class="manga__views">50 000</div>
  <div class="manga__description">Описание тайтла.</div>
  <div class="manga__name-alt"><span>One Piece</span></div>
  <div class="manga__middle-links">
    <a href="/genres/priklyucheniya">Приключения</a>
    <a href="/status/ongoing">продолжается</a>
  </div>
  <a class="chapters__item" href="/manga/one-piece/2">
    <span class="chapters__value">Глава 2</span>
    <span class="chapters__add-date">02.01.2024</span>
  </a>
  <a class="chapters__item" href="/manga/one-piece/1">
    <span class="chapters__value">Глава 1</span>
    <span class="chapters__add-date">01.01.2024</span>
  </a>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <div class="reader__pages">
    <img data-src="/pages/001.jpg" />
    <img data-src="/pages/002.jpg" />
  </div>
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
  http.register((url) => url.includes('/manga/one-piece/2'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/manga/one-piece'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.includes('/manga?'), { status: 200, body: LIST_HTML });
  return http;
}

describe('MangaBuff parser conformance', () => {
  const http = setUpFixtures();
  const parser = createMangaBuffParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MANGABUFF');
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThan(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    expect(manga.rating).toBeCloseTo(0.87, 5);
    expect(manga.state).toBe('ONGOING');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.description).toContain('Описание тайтла.');
    expect(manga.description).toContain('Рейтинг: 87%');
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    const chapter2 = manga.chapters!.find((c) => c.number === 2)!;
    const pages = await parser.getPages(chapter2.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/pages/001.jpg`);
  });
});

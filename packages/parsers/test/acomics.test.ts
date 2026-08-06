import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createAComicsParser } from '../src/sources/acomics';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'acomics.example';

const LIST_HTML = `<!doctype html><html><body>
  <table class="list-loadable">
    <tr><td>
      <a href="/one-piece"><img src="/covers/op.jpg" /></a>
      <div class="title">Ван-Пис</div>
    </td></tr>
  </table>
</body></html>`;

const TAGS_HTML = `<!doctype html><html><body>
  <div id="catalog">
    <a class="button" onclick="filter('action')"><span>x</span>Приключения</a>
  </div>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <div class="title">Ван-Пис</div>
  <p class="serial-about-badges"><span class="category">Приключения</span></p>
  <p>Автор оригинала: Oda Eiichiro</p>
  <section class="serial-about-text"><p>Описание тайтла.</p></section>
</body></html>`;

const ISSUE_PAGE_HTML = (n: number, total: number) => `<!doctype html><html><body>
  <span class="issueNumber">${n}/${total}</span>
  <img id="mainImage" src="/issues/${n}.jpg" />
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
  http.register((url) => url.endsWith('/one-piece/1'), {
    status: 200,
    body: ISSUE_PAGE_HTML(1, 2),
  });
  http.register((url) => url.endsWith('/one-piece/2'), {
    status: 200,
    body: ISSUE_PAGE_HTML(2, 2),
  });
  http.register((url) => url.endsWith('/one-piece/about'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.endsWith('/comics'), { status: 200, body: TAGS_HTML });
  http.register((url) => url.includes('/comics?'), { status: 200, body: LIST_HTML });
  return http;
};

describe('AComics parser conformance', () => {
  const http = setUpFixtures();
  const parser = createAComicsParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('ACOMICS');
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.publicUrl.endsWith('/about')).toBe(true);
  });

  it('getDetails: single synthetic chapter, tags resolved via shared tag map', async () => {
    const manga = await parser.getDetails('/one-piece/about');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(1);
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getPages: resolves every issue page up front, absolute urls', async () => {
    const manga = await parser.getDetails('/one-piece/about');
    const pages = await parser.getPages(manga.chapters![0]!.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/issues/1.jpg`);
    expect(pages[1]!.url).toBe(`https://${DOMAIN}/issues/2.jpg`);
  });
});

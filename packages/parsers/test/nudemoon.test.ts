import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { CONTENT_RATING } from '@tanuki/contracts';
import { createNudeMoonParser } from '../src/sources/nudemoon';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'nude-moon.example';

const LIST_HTML = `<!doctype html><html><body>
  <table class="news_pic2">
    <tr><td>
      <a href="/12345-some-title" title="Альт Тайтл / Основной Тайтл"></a>
      <img src="/covers/12345.jpg" />
      <a href="/mangaka/someone">Some Author</a>
      <div class="tag-links"><a href="/tag/action">боевик</a></div>
      <div class="description">Краткое описание.</div>
    </td></tr>
  </table>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <table class="news_pic2">
    <tr><td>
      <a href="/read/12345" title="Альт Тайтл / Основной Тайтл"></a>
      <a href="/mangaka/someone">Some Author</a>
      <a href="/perevod/team-a">TeamA</a>
      <a href="/tag/action">боевик</a>
      <img src="ico/time.png" /><span>9 января 2024</span>
      <div class="description">Полное описание.</div>
    </td></tr>
  </table>
  <img data-src="/covers/12345-full.jpg" />
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <img data-src="/pages/001.jpg" />
  <img data-src="/pages/002.jpg" />
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
  http.register((url) => url.endsWith('/read/12345/1'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/read/12345'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.includes('/all_manga'), { status: 200, body: LIST_HTML });
  return http;
};

describe('Nude-Moon parser conformance', () => {
  const http = setUpFixtures();
  const parser = createNudeMoonParser(makeContext(http));

  it('getList: chapters null, rating -1, adult content rating, url relative', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.NUDEMOON);
    expect(item!.rating).toBe(-1);
    expect(item!.contentRating).toBe(CONTENT_RATING.ADULT);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    // format is "AltTitle / MainTitle"
    expect(item!.title).toBe('Основной Тайтл');
    expect(item!.altTitles).toEqual(['Альт Тайтл']);
    expect(item!.authors).toEqual(['Some Author']);
    expect(item!.tags.map((t) => t.title)).toEqual(['Боевик']);
  });

  it('getDetails: single synthetic chapter with valid sentinels', async () => {
    const manga = await parser.getDetails('/read/12345');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(1);
    const chapter = manga.chapters![0]!;
    expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    expect(chapter.scanlator).toBe('TeamA');
    expect(manga.description).toBe('Полное описание.');
    expect(manga.largeCoverUrl).toBe(`https://${DOMAIN}/covers/12345-full.jpg`);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/read/12345');
    const pages = await parser.getPages(`${manga.chapters![0]!.url}/1`);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/pages/001.jpg`);
  });

  it('getList: search without auth throws', async () => {
    await expect(parser.getList({ offset: 0, limit: 20, query: 'test' })).rejects.toThrow();
  });
});

/** The site collapses multi-chapter series in `all_manga`, so consecutive `rowstart` windows
 *  can legitimately return an already-seen card (e.g. rowstart=0 -> [1,2], rowstart=30 -> [2,3]).
 *  Regression coverage for the bug where paging through the web UI showed repeated titles
 *  because dedup used to be scoped to a single getList() call instead of the whole scan. */
const rowRow = (id: number): string => {
  return `<table class="news_pic2"><tr><td>
    <a href="/${id}-title" title="Alt${id} / Title${id}"></a>
    <img src="/covers/${id}.jpg" />
  </td></tr></table>`;
};

describe('Nude-Moon parser: cross-page dedup', () => {
  it('does not repeat cards across sequential getList pages', async () => {
    const byRowstart: Record<number, number[]> = {
      0: [1, 2],
      30: [2, 3],
      60: [4, 5],
    };
    const http = new FakeHttpClient();
    for (const [rowstart, ids] of Object.entries(byRowstart)) {
      http.register((url) => url.includes(`rowstart=${rowstart}`), {
        status: 200,
        body: `<!doctype html><html><body>${ids.map(rowRow).join('')}</body></html>`,
      });
    }
    http.register((url) => url.includes('/all_manga'), {
      status: 200,
      body: '<!doctype html><html><body></body></html>',
    });

    const parser = createNudeMoonParser(makeContext(http));
    const page1 = await parser.getList({ offset: 0, limit: 2 });
    const page2 = await parser.getList({ offset: 2, limit: 2 });

    const ids1 = new Set(page1.map((m) => m.id));
    const ids2 = new Set(page2.map((m) => m.id));
    expect(ids1.size).toBe(2);
    expect(ids2.size).toBe(2);
    for (const id of ids1) {
      expect(ids2.has(id)).toBe(false);
    }
  });
});

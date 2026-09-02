import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { CONTENT_RATING } from '@tanuki/contracts';
import { createHentaichanCcParser } from '../src/sources/hentaichancc';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'hentaichan.cc';
const API_BASE = 'https://backend.hentaichan.cc';
const CDN_BASE = 'https://cdn.hentaichan.cc';

const LIST_RESPONSE = JSON.stringify({
  data: [
    {
      id: 5243,
      name: '1 + 2 (Ato no Futari)',
      slug: '1-2-ato-no-futari',
      cover: { filename_disk: '4e209016-3118-4381-bc99-722f25beca24.jpg' },
    },
  ],
});

const DETAILS_RESPONSE = JSON.stringify({
  data: [
    {
      id: 5243,
      name: '1 + 2 (Ato no Futari)',
      slug: '1-2-ato-no-futari',
      cover: { filename_disk: '4e209016-3118-4381-bc99-722f25beca24.jpg' },
      description: 'Описание тайтла.',
      russian_name: null,
      english_name: '1 + 2',
      romaji_name: 'Ato no Futari',
      tags: [{ tags_id: { name: 'ahegao', slug: 'ahegao' } }],
      authors: [{ authors_id: { name: 'Satomi' } }],
    },
  ],
});

const CHAPTERS_RESPONSE = JSON.stringify({
  data: [{ id: 5206 }, { id: 5300 }],
});

const PAGES_RESPONSE = JSON.stringify({
  data: {
    id: 5206,
    pages: [
      { directus_files_id: { filename_disk: 'c3f9958e-81f9-400f-a9c9-fa1145b5041f.webp' } },
      { directus_files_id: { filename_disk: '14e6522e-374b-4b28-b5c0-8603534afd40.webp' } },
    ],
  },
});

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
  http.register((url) => url.startsWith(`${API_BASE}/items/chapters/5206`), {
    status: 200,
    body: PAGES_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`${API_BASE}/items/chapters`), {
    status: 200,
    body: CHAPTERS_RESPONSE,
    contentType: 'application/json',
  });
  http.register(
    (url) => url.startsWith(`${API_BASE}/items/manga`) && url.includes('filter%5Bid%5D'),
    { status: 200, body: DETAILS_RESPONSE, contentType: 'application/json' },
  );
  http.register((url) => url.startsWith(`${API_BASE}/items/manga`), {
    status: 200,
    body: LIST_RESPONSE,
    contentType: 'application/json',
  });
  return http;
};

describe('HentaiChan.cc parser conformance', () => {
  const http = setUpFixtures();
  const parser = createHentaichanCcParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.HENTAICHAN_CC);
    expect(item!.rating).toBe(-1);
    expect(item!.contentRating).toBe(CONTENT_RATING.ADULT);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toBe('https://hentaichan.cc/manga/1-2-ato-no-futari');
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.coverUrl).toBe(`${CDN_BASE}/4e209016-3118-4381-bc99-722f25beca24.jpg`);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('5243,,1-2-ato-no-futari');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate).toBe(0);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.altTitles).toEqual(['1 + 2', 'Ato no Futari']);
    expect(manga.tags.map((t) => t.title)).toEqual(['Ahegao']);
    expect(manga.authors).toEqual(['Satomi']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('5243,,1-2-ato-no-futari');
    const pages = await parser.getPages(manga.chapters![0]!.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`${CDN_BASE}/c3f9958e-81f9-400f-a9c9-fa1145b5041f.webp`);
  });
});

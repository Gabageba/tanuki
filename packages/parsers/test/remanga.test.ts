import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createRemangaParser } from '../src/sources/remanga';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'remanga.example';
const API_HOST = `api.${DOMAIN}`;

const LIST_JSON = JSON.stringify({
  results: [
    {
      dir: 'one-piece',
      main_name: 'Ван-Пис',
      secondary_name: 'One Piece',
      avg_rating: 8.5,
      cover: { mid: '/covers/op-mid.jpg', high: '/covers/op-high.jpg' },
      status: { id: 2 },
      genres: [{ id: 1, name: 'приключения' }],
    },
  ],
});

const DETAILS_JSON = JSON.stringify({
  dir: 'one-piece',
  main_name: 'Ван-Пис',
  another_name: 'One Piece / OP',
  secondary_name: 'Wan Pis',
  avg_rating: 8.7,
  cover: { mid: '/covers/op-mid.jpg', high: '/covers/op-high.jpg' },
  status: { id: 2 },
  age_limit: { id: 0 },
  genres: [{ id: 1, name: 'приключения' }],
  description: 'Описание тайтла.',
  branches: [{ id: 555, publishers: { name: 'TeamA' } }],
});

const CHAPTERS_PAGE1_JSON = JSON.stringify({
  results: [
    {
      id: 9001,
      chapter: 1,
      tome: 1,
      name: 'Начало',
      upload_date: '2024-01-01T09:30:00',
      is_paid: false,
      is_bought: false,
      publishers: [{ name: 'TeamA' }],
    },
    {
      id: 9002,
      chapter: 2,
      tome: 1,
      name: 'Продолжение',
      upload_date: '2024-01-02T10:00:00',
      is_paid: false,
      is_bought: false,
      publishers: [{ name: 'TeamA' }],
    },
  ],
});

const CHAPTERS_PAGE2_JSON = JSON.stringify({ results: [] });

const PAGES_JSON = JSON.stringify({
  pages: [
    { link: 'https://cdn.remanga.example/001.jpg' },
    { link: 'https://cdn.remanga.example/002.jpg' },
  ],
});

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
  http.register(
    (url) => url.includes('/api/v2/titles/chapters/?'),
    (() => {
      let calls = 0;
      return () => {
        calls += 1;
        return {
          status: 200,
          body: calls % 2 === 1 ? CHAPTERS_PAGE1_JSON : CHAPTERS_PAGE2_JSON,
          contentType: 'application/json',
        };
      };
    })(),
  );
  http.register((url) => url.includes('/api/v2/titles/chapters/9') && url.endsWith('/'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/api/v2/titles/one-piece/`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/api/v2/search`), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
}

describe('Remanga parser conformance', () => {
  const http = setUpFixtures();
  const parser = createRemangaParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('REMANGA');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
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
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/manga/one-piece');
    const chapter1 = manga.chapters!.find((c) => c.number === 1)!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://cdn.remanga.example/001.jpg');
  });
});

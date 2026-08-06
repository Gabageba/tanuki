import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createTomiloLibParser } from '../src/sources/tomilolib';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'tomilo-lib.example';
const TITLE_ID = 'title-1';

const LIST_JSON = JSON.stringify({
  data: {
    titles: [
      {
        _id: TITLE_ID,
        slug: 'one-piece',
        name: 'Ван-Пис',
        coverImage: '/uploads/titles/1/cover.jpg',
        genres: ['Приключения'],
        averageRating: 8.5,
        status: 'ongoing',
      },
    ],
  },
});

const DETAILS_JSON = JSON.stringify({
  data: {
    _id: TITLE_ID,
    slug: 'one-piece',
    name: 'Ван-Пис',
    coverImage: '/uploads/titles/1/cover.jpg',
    genres: ['Приключения'],
    averageRating: 8.7,
    status: 'ongoing',
    description: 'Описание тайтла.',
    chapters: [
      { _id: 'ch-2', isPublished: true, chapterNumber: 2, releaseDate: '2024-01-02T10:00:00.000Z' },
      { _id: 'ch-1', isPublished: true, chapterNumber: 1, releaseDate: '2024-01-01T09:30:00.000Z' },
    ],
  },
});

const PAGES_JSON = JSON.stringify({
  data: { pages: ['/chapters/ch-1/001.webp', '/chapters/ch-1/002.webp'] },
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
  http.register((url) => url.includes('/api/chapters/ch-1'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/titles/slug/one-piece'), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/titles?'), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('TomiloLib parser conformance', () => {
  const http = setUpFixtures();
  const parser = createTomiloLibParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('TOMILOLIB');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.coverUrl).toBe('https://s3.regru.cloud/tomilolib/titles/1/cover.jpg');
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/titles/one-piece');
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
    const manga = await parser.getDetails('/titles/one-piece');
    const chapter1 = manga.chapters!.find((c) => c.number === 1)!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://s3.regru.cloud/tomilolib/chapters/ch-1/001.webp');
  });
});

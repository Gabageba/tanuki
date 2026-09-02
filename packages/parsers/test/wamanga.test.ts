import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { SORT_ORDER } from '@tanuki/contracts';
import { createWaMangaParser } from '../src/sources/wamanga';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'wamanga.example';
const MANGA_ID = 'manga-1';

const LIST_JSON = JSON.stringify([
  {
    id: MANGA_ID,
    slug: 'one-piece',
    title: 'Ван-Пис',
    titleEnglish: 'One Piece',
    coverUrl: '/covers/op.jpg',
    genres: ['приключения'],
    statusTitle: 'ongoing',
    authors: ['Oda Eiichiro'],
    isAdult: false,
  },
]);

const DETAILS_JSON = JSON.stringify({
  id: MANGA_ID,
  slug: 'one-piece',
  title: 'Ван-Пис',
  titleEnglish: 'One Piece',
  coverUrl: '/covers/op.jpg',
  imageUrl: '/covers/op-full.jpg',
  genres: ['приключения'],
  statusTitle: 'ongoing',
  authors: ['Oda Eiichiro'],
  isAdult: false,
  description: 'Описание тайтла.',
  teams: [{ name: 'TeamA' }],
});

const CHAPTERS_JSON = JSON.stringify([
  { id: 'ch-1', position: 1, title: 'Глава 1', createdAt: '2024-01-01T09:30:00.000Z' },
  { id: 'ch-2', position: 2, title: 'Глава 2', createdAt: '2024-01-02T10:00:00.000Z' },
]);

const PAGES_JSON = JSON.stringify({
  files: [{ diskFile: '/files/001.jpg' }, { diskFile: '/files/002.jpg' }],
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
  http.register((url) => url.includes('/chapters/ch-1'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.endsWith(`/manga/${MANGA_ID}/chapters`), {
    status: 200,
    body: CHAPTERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.endsWith(`/manga/${MANGA_ID}`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/v1/manga?'), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('WaManga parser conformance', () => {
  const http = setUpFixtures();
  const parser = createWaMangaParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.WAMANGA);
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.altTitles).toEqual(['One Piece']);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails(MANGA_ID);
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      expect(chapter.scanlator).toBe('TeamA');
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getList: defaults to updatedAt desc, maps the other sort orders', async () => {
    const cases: [string | undefined, string, string][] = [
      [undefined, 'updatedAt', 'true'],
      [SORT_ORDER.UPDATED, 'updatedAt', 'true'],
      [SORT_ORDER.NEWEST, 'createdAt', 'true'],
      [SORT_ORDER.POPULARITY, 'views', 'true'],
      [SORT_ORDER.ALPHABETICAL, 'alphabetical', 'false'],
    ];
    for (const [order, key, descending] of cases) {
      const fresh = setUpFixtures();
      await createWaMangaParser(makeContext(fresh)).getList({ offset: 0, limit: 20, order });
      const url = new URL(fresh.requests[0]!.url);
      expect(url.searchParams.get('sortKey')).toBe(key);
      expect(url.searchParams.get('sortDescending')).toBe(descending);
    }
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const pages = await parser.getPages('ch-1');
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/files/001.jpg`);
  });
});

import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createLibSocialParser } from '../src/sources/libsocial/engine';
import type { LibSocialConfig } from '../src/sources/libsocial/config';
import { LIBSOCIAL_API_HOST } from '../src/sources/libsocial/config';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'mangalib.org';
const SLUG = '123--one-piece';

const CFG: LibSocialConfig = {
  id: 'MANGALIB',
  title: 'MangaLib',
  siteId: 1,
  domains: [DOMAIN],
  isNsfw: false,
  authRequiredOnMissingPages: true,
};

const LIST_JSON = JSON.stringify({
  data: [
    {
      id: 123,
      name: 'One Piece',
      rus_name: 'Ван-Пис',
      slug_url: SLUG,
      cover: {
        thumbnail: `https://${LIBSOCIAL_API_HOST}/uploads/123-thumb.jpg`,
        default: `https://${LIBSOCIAL_API_HOST}/uploads/123-full.jpg`,
      },
      rating: { average: 8.5 },
      status: { id: 1 },
    },
  ],
});

const DETAILS_JSON = JSON.stringify({
  data: {
    id: 123,
    name: 'One Piece',
    rus_name: 'Ван-Пис',
    cover: {
      thumbnail: `https://${LIBSOCIAL_API_HOST}/uploads/123-thumb.jpg`,
      default: `https://${LIBSOCIAL_API_HOST}/uploads/123-full.jpg`,
    },
    genres: [{ id: 34, name: 'Приключения' }],
    tags: [{ id: 56, name: 'Пираты' }],
    authors: [{ name: 'Oda Eiichiro' }],
    summary: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Первый абзац.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Второй абзац.' }] },
      ],
    },
    close_view: 0,
    rating: { average: 8.7 },
    status: { id: 1 },
    ageRestriction: { id: 1 },
  },
});

const CHAPTERS_JSON = JSON.stringify({
  data: [
    {
      // Sent as strings live for some manga (e.g. HENTAILIB) instead of the usual JSON numbers.
      volume: '1',
      number: '2',
      name: null,
      branches: [
        {
          id: 9002,
          branch_id: 0,
          teams: [{ name: 'TeamA' }],
          created_at: '2024-01-02T10:00:00.000Z',
        },
      ],
    },
    {
      volume: 1,
      number: 1,
      name: null,
      branches: [
        {
          id: 9001,
          branch_id: 0,
          teams: [{ name: 'TeamA' }],
          created_at: '2024-01-01T09:30:00.000Z',
        },
      ],
    },
  ],
});

const IMAGE_SERVERS_JSON = JSON.stringify({
  data: {
    imageServers: [
      { id: 'main', url: 'https://img1.example/', site_ids: [1] },
      { id: 'compress', url: 'https://img1-thumb.example/', site_ids: [1] },
    ],
  },
});

const PAGES_JSON = JSON.stringify({
  data: {
    pages: [
      { id: 1, url: '001.jpg' },
      { id: 2, url: '002.jpg' },
    ],
  },
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
  http.register((url) => url.includes('/chapters'), {
    status: 200,
    body: CHAPTERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/chapter?'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/constants'), {
    status: 200,
    body: IMAGE_SERVERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${LIBSOCIAL_API_HOST}/api/manga/${SLUG}`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${LIBSOCIAL_API_HOST}/api/manga?`), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
}

describe('LibSocial parser conformance', () => {
  const http = setUpFixtures();
  const parser = createLibSocialParser(CFG, makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MANGALIB');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails(SLUG);
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      // number/volume must come out as real numbers even when the API sends them as strings.
      expect(typeof chapter.number).toBe('number');
      expect(typeof chapter.volume).toBe('number');
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Первый абзац.\n\nВторой абзац.');
    expect(manga.tags.map((t) => t.title).sort()).toEqual(['Пираты', 'Приключения']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails(SLUG);
    const chapter2 = manga.chapters!.find((c) => c.number === 2)!;
    const pages = await parser.getPages(chapter2.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://img1.example/001.jpg');
    expect(pages[0]!.preview).toBe('https://img1-thumb.example/001.jpg');
  });
});

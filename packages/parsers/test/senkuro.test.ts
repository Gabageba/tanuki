import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createSenkuroParser } from '../src/sources/senkuro/engine';
import { SENKURO_CONFIGS } from '../src/sources/senkuro/config';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'senkuro.com';

const SEARCH_RESPONSE = JSON.stringify({
  data: {
    mangas: {
      edges: [
        {
          node: {
            id: '123',
            slug: 'one-piece',
            titles: [
              { lang: 'EN', content: 'One Piece' },
              { lang: 'RU', content: 'Ван-Пис' },
            ],
            cover: { original: { url: 'https://cdn.senkuro.com/one-piece.jpg' } },
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
});

const DETAILS_RESPONSE = JSON.stringify({
  data: {
    mangaTachiyomiInfo: {
      id: '123',
      slug: 'one-piece',
      titles: [{ lang: 'RU', content: 'Ван-Пис' }],
      alternativeNames: [{ lang: 'EN', content: 'One Piece' }],
      localizations: [{ lang: 'RU', description: 'Описание тайтла.' }],
      rating: 'GENERAL',
      status: 'ONGOING',
      labels: [{ slug: 'adventure', titles: [{ lang: 'RU', content: 'приключения' }] }],
      cover: { original: { url: 'https://cdn.senkuro.com/one-piece.jpg' } },
      mainStaff: [{ person: { name: 'Oda Eiichiro' } }],
    },
  },
});

const CHAPTERS_RESPONSE = JSON.stringify({
  data: {
    mangaTachiyomiChapters: {
      chapters: [
        {
          id: 'c2',
          slug: 'ch-2',
          number: '2',
          volume: '1',
          teamIds: ['t1'],
          createdAt: '2024-01-02T10:00:00.000Z',
        },
        {
          id: 'c1',
          slug: 'ch-1',
          number: '1',
          volume: '1',
          teamIds: ['t1'],
          createdAt: '2024-01-01T09:30:00.000Z',
        },
      ],
      teams: [{ id: 't1', name: 'TeamA' }],
    },
  },
});

const PAGES_RESPONSE = JSON.stringify({
  data: {
    mangaTachiyomiChapterPages: {
      pages: [
        { url: 'https://cdn.senkuro.com/001.jpg' },
        { url: 'https://cdn.senkuro.com/002.jpg' },
      ],
    },
  },
});

const SENKURO_CONFIG = SENKURO_CONFIGS.find((c) => c.id === 'SENKURO')!;
const SENKOGNITO_CONFIG = SENKURO_CONFIGS.find((c) => c.id === 'SENKOGNITO')!;

function makeContext(http: FakeHttpClient, domain = DOMAIN): ParserContext {
  return {
    http,
    domain,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
}

// `http` is a parameter so a caller can register its own rule (e.g. a request spy) ahead of
// these — FakeHttpClient matches in registration order and stops at the first hit.
function setUpFixtures(
  endpoint = SENKURO_CONFIG.apiEndpoint,
  http = new FakeHttpClient(),
): FakeHttpClient {
  http.register((url, body) => url === endpoint && !!body?.includes('mangaTachiyomiChapterPages'), {
    status: 200,
    body: PAGES_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('mangaTachiyomiChapters('), {
    status: 200,
    body: CHAPTERS_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('mangaTachiyomiInfo'), {
    status: 200,
    body: DETAILS_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('fetchMangas'), {
    status: 200,
    body: SEARCH_RESPONSE,
    contentType: 'application/json',
  });
  return http;
}

describe('Senkuro parser conformance', () => {
  const http = setUpFixtures();
  const parser = createSenkuroParser(SENKURO_CONFIG, makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('SENKURO');
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    // RU title preferred over EN
    expect(item!.title).toBe('Ван-Пис');
    expect(http.requests[0]!.headers['app-id']).toBe(SENKURO_CONFIG.appId);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('123,,one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      expect(chapter.scanlator).toBe('TeamA');
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    expect(manga.description).toContain('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('123,,one-piece');
    const chapter1 = manga.chapters!.find((c) => c.number === 1)!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://cdn.senkuro.com/001.jpg');
  });
});

// SENKOGNITO is the same engine over the same backend, so the only behaviour worth asserting
// separately is the part the config actually changes: which host is called, which catalog the
// app-id header selects, and which source the results are attributed to.
describe('Senkognito config', () => {
  it('lists its own catalog from its own API host', async () => {
    const http = setUpFixtures(SENKOGNITO_CONFIG.apiEndpoint);
    const parser = createSenkuroParser(SENKOGNITO_CONFIG, makeContext(http, 'ne.senkognito.com'));

    const items = await parser.getList({ offset: 0, limit: 20 });

    // Sending Senkuro's app-id (or none at all) would silently serve Senkuro's catalog.
    expect(http.requests).toHaveLength(1);
    expect(http.requests[0]!.url).toBe(SENKOGNITO_CONFIG.apiEndpoint);
    expect(http.requests[0]!.headers['app-id']).toBe(SENKOGNITO_CONFIG.appId);
    expect(SENKOGNITO_CONFIG.appId).not.toBe(SENKURO_CONFIG.appId);
    expect(items[0]!.source).toBe('SENKOGNITO');
    expect(items[0]!.publicUrl).toBe('https://ne.senkognito.com/manga/one-piece');
    // Different source id ⇒ a different uid for the same upstream manga, so the two storefronts
    // never collide in the app's catalog.
    const senkuroItems = await createSenkuroParser(
      SENKURO_CONFIG,
      makeContext(setUpFixtures()),
    ).getList({ offset: 0, limit: 20 });
    expect(items[0]!.id).not.toBe(senkuroItems[0]!.id);
  });

  it('exposes the catalog entry as a HENTAI source', () => {
    const parser = createSenkuroParser(SENKOGNITO_CONFIG, makeContext(new FakeHttpClient()));
    expect(parser.info.title).toBe('Senkognito');
    expect(parser.info.contentType).toBe('HENTAI');
  });
});

import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createInkStoryParser } from '../src/sources/inkstory';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'inkstory.net';
const API_HOST = `api.${DOMAIN}`;
const MANGA_ID = 'aaaa-bbbb-1111';

const LIST_MANGA_JSON = {
  id: MANGA_ID,
  name: { ru: 'Ван-Пис', en: 'One Piece' },
  slug: 'one-piece',
  averageRating: 8.5,
  contentStatus: 'SAFE',
  poster: 'https://cdn.inkstory.me/one-piece.jpg',
  status: 'ONGOING',
};

// /v2/books?sort=updatedAt,desc sorts by book metadata edits, not chapter releases, so the
// default 'UPDATED' order reads this feed of latest chapter drops instead — see createInkStoryParser.
const UPDATED_FEED_JSON = JSON.stringify([{ book: LIST_MANGA_JSON }]);

const LIST_JSON = JSON.stringify([LIST_MANGA_JSON]);

const DETAILS_JSON = JSON.stringify({
  id: MANGA_ID,
  name: { ru: 'Ван-Пис', en: 'One Piece' },
  slug: 'one-piece',
  averageRating: 8.7,
  contentStatus: 'SAFE',
  poster: 'https://cdn.inkstory.me/one-piece.jpg',
  labels: [{ name: 'приключения', slug: 'adventure' }],
  status: 'ONGOING',
  relations: [{ type: 'AUTHOR', publisher: { name: 'Oda Eiichiro' } }],
  description: 'Описание тайтла.',
});

const CHAPTERS_JSON = JSON.stringify([
  { id: 'ch-1', number: 1, volume: 1, branchId: 'br-1', createdAt: '2024-01-01T09:30:00.123456Z' },
  { id: 'ch-2', number: 2, volume: 1, branchId: 'br-1', createdAt: '2024-01-02T10:00:00.123456Z' },
]);

const BRANCH_JSON = JSON.stringify({ publishers: [{ name: 'TeamA' }] });

const PAGES_JSON = JSON.stringify({
  pages: [
    { id: 'p1', image: 'https://cdn.inkstory.me/001.jpg' },
    { id: 'p2', image: 'https://cdn.inkstory.me/002.jpg' },
  ],
});

const SECRET_KEY = 'UySkp0BzPhwlvP2V';
const SSR_STATE_HTML = `<script id="it-astro-state">["secret-key","${SECRET_KEY}"]</script>`;

function xor(bytes: Buffer, key: string): Buffer {
  const keyBytes = Buffer.from(key, 'utf8');
  return Buffer.from(bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]!));
}

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
  http.register((url) => url.includes('/v2/chapters/ch-'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/v2/chapters?'), {
    status: 200,
    body: CHAPTERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/v2/branches/'), {
    status: 200,
    body: BRANCH_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/v2/books/${MANGA_ID}`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${API_HOST}/v2/books?`), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/v2/chapter-update-feed'), {
    status: 200,
    body: UPDATED_FEED_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url === `https://${DOMAIN}/`, {
    status: 200,
    body: SSR_STATE_HTML,
    contentType: 'text/html; charset=utf-8',
  });
  return http;
}

describe('Inkstory parser conformance', () => {
  const http = setUpFixtures();
  const parser = createInkStoryParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('INKSTORY');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
  });

  it('getList: non-UPDATED order still reads /v2/books with a sort key', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, order: 'POPULARITY' });
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe('Ван-Пис');
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails(MANGA_ID);
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.chapters![0]!.branch).toBe('TeamA');
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const pages = await parser.getPages('ch-1');
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://cdn.inkstory.me/001.jpg');
  });

  it('decodeImage: XOR-decodes obfuscated chapter images, passes through everything else', async () => {
    const plaintext = Buffer.from('RIFF....WEBPVP8 fake-but-plausible-payload');
    const obfuscatedUrl =
      'https://static.inuko.me/chapters/f93fcd31/b9b3bb3d-70a3-xc29-b784-205ab9e63611.webp';
    const encoded = xor(plaintext, SECRET_KEY);
    const decoded = await parser.decodeImage!(encoded, obfuscatedUrl);
    expect(decoded.equals(plaintext)).toBe(true);

    const plainUrl =
      'https://static.inuko.me/book/aaaa/poster/65ae6e4c-d952-4ef6-831a-0c982baa72b0.jpeg';
    const untouched = Buffer.from('not obfuscated');
    expect((await parser.decodeImage!(untouched, plainUrl)).equals(untouched)).toBe(true);
  });
});

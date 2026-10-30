import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { BUILT_IN_BOOKMARK_FOLDER, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { ParserContext } from '../src/core/parser';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { generateUid } from '../src/core/uid';
import {
  ParseError,
  SourceAuthRequiredError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import { createRegistry } from '../src/registry';
import { SOURCE_ID } from '../src/sources/catalog';
import { createRemangaParser } from '../src/sources/remanga';
import {
  createRemangaSessionJar,
  fetchRemangaViewer,
  getRemangaSessionToken,
  parseRemangaSessionValue,
} from '../src/sources/remanga/auth';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'remanga.example';
const API = `https://api.${DOMAIN}`;
const TOKEN = 'test-account-token-for-remanga';
const USER = { id: 42, username: 'reader' };
const TITLE = {
  dir: 'one-piece',
  main_name: 'Ван-Пис',
  cover: { mid: '/covers/one-piece.jpg' },
  type: { id: 1 },
};

const makeContext = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const registerJson = (http: FakeHttpClient, path: string, body: unknown, status = 200) =>
  http.register((url) => url === `${API}${path}`, {
    status,
    body: JSON.stringify(body),
    contentType: 'application/json',
  });
const withAccount = async <T>(fn: () => Promise<T>, token = TOKEN) =>
  runWithSourceAccounts(
    { [SOURCE_AUTH_FAMILY.REMANGA]: { jar: await createRemangaSessionJar(DOMAIN, token) } },
    fn,
  );

// Формат и типы папок — из публичного JS-клиента ReManga. read_progress — счётчик, не позиция.
describe('ReManga bookmarks import', () => {
  it('imports all pages and keeps custom folders; ids and URLs match the catalog', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/api/v2/users/current/', USER);
    registerJson(http, '/api/v2/users/42/user_bookmarks/?page=1', {
      results: [{ id: 101, type: 1, name: 'Читаю' }],
      next: 'https://other.example/page=2',
    });
    registerJson(http, '/api/v2/users/42/user_bookmarks/?page=2', {
      results: [{ id: 202, type: 8, name: 'На выходные' }],
      next: null,
    });
    registerJson(http, '/api/v2/users/42/bookmarks/?type=101&page=1', {
      results: [{ title: TITLE, read_progress: 20 }],
      next: '?page=2',
    });
    registerJson(http, '/api/v2/users/42/bookmarks/?type=101&page=2', {
      results: [{ title: { ...TITLE, dir: 'second-title', main_name: 'Второй' } }],
      next: null,
    });
    registerJson(http, '/api/v2/users/42/bookmarks/?type=202&page=1', {
      results: [{ title: { ...TITLE, cover: null } }, { title: null }],
      next: null,
    });
    const folders = await withAccount(() => createRemangaParser(makeContext(http)).getBookmarks!());
    expect(
      folders.map(({ id, name, builtIn, items }) => ({ id, name, builtIn, count: items.length })),
    ).toEqual([
      { id: '101', name: 'Читаю', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, count: 2 },
      { id: '202', name: 'На выходные', builtIn: null, count: 1 },
    ]);
    expect(folders[0]!.items[0]).toMatchObject({
      id: generateUid(SOURCE_ID.REMANGA, '/manga/one-piece'),
      url: '/manga/one-piece',
      title: 'Ван-Пис',
      coverUrl: `${API}/covers/one-piece.jpg`,
      lastChapterNumber: null,
      lastChapterVolume: null,
    });
    expect(folders[1]!.items[0]!.coverUrl).toBeNull();
    expect(
      http.requests.every(
        ({ url, headers }) => url.startsWith(API) && headers.Authorization === `Bearer ${TOKEN}`,
      ),
    ).toBe(true);
  });

  it('maps the site folder types, including on hold and favorites, without relying on folder ids', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/api/v2/users/current/', USER);
    const folders = [1, 2, 3, 4, 5, 6, 7, 8, 99].map((type) => ({
      id: 100 + type,
      type,
      name: `Папка ${type}`,
    }));
    registerJson(http, '/api/v2/users/42/user_bookmarks/?page=1', { results: folders });
    for (const folder of folders)
      registerJson(http, `/api/v2/users/42/bookmarks/?type=${folder.id}&page=1`, { results: [] });
    const result = await withAccount(() => createRemangaParser(makeContext(http)).getBookmarks!());
    expect(result.map(({ builtIn }) => builtIn)).toEqual([
      BUILT_IN_BOOKMARK_FOLDER.READING,
      BUILT_IN_BOOKMARK_FOLDER.PLANNED,
      BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
      BUILT_IN_BOOKMARK_FOLDER.DROPPED,
      BUILT_IN_BOOKMARK_FOLDER.ON_HOLD,
      null,
      BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
      null,
      null,
    ]);
  });

  it('does not read any bookmarks without the caller’s own session', async () => {
    const http = new FakeHttpClient();
    const parser = createRemangaParser(makeContext(http));
    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.INUKO]: { jar: new CookieJar() } },
      async () => {
        await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
      },
    );
    expect(http.requests).toEqual([]);
  });

  it('treats an expired session as authentication failure, not an empty library', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/api/v2/users/current/', {}, 401);
    await expect(
      withAccount(() => createRemangaParser(makeContext(http)).getBookmarks!()),
    ).rejects.toBeInstanceOf(SourceTokenExpiredError);
  });

  it('does not return a partial library when a later page fails', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/api/v2/users/current/', USER);
    registerJson(http, '/api/v2/users/42/user_bookmarks/?page=1', {
      results: [{ id: 1, type: 1, name: 'Читаю' }],
    });
    registerJson(http, '/api/v2/users/42/bookmarks/?type=1&page=1', {
      results: [{ title: TITLE }],
      next: '?page=2',
    });
    registerJson(http, '/api/v2/users/42/bookmarks/?type=1&page=2', {}, 503);
    await expect(
      withAccount(() => createRemangaParser(makeContext(http)).getBookmarks!()),
    ).rejects.toBeInstanceOf(SourceUnavailableError);
  });

  it('rejects malformed pages rather than reporting that the library is empty', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/api/v2/users/current/', USER);
    registerJson(http, '/api/v2/users/42/user_bookmarks/?page=1', { content: [] });
    await expect(
      withAccount(() => createRemangaParser(makeContext(http)).getBookmarks!()),
    ).rejects.toBeInstanceOf(ParseError);
  });

  it('advertises import through the registry', async () => {
    const registry = createRegistry({
      credentials: {},
      logger: makeContext(new FakeHttpClient()).logger,
    });
    try {
      expect(registry.get(SOURCE_ID.REMANGA).info.isBookmarksImportSupported).toBe(true);
    } finally {
      await registry.close();
    }
  });
});

describe('ReManga session', () => {
  it('accepts a raw cookie value, a cookie pair and a full cookie header', async () => {
    expect(parseRemangaSessionValue(TOKEN)).toBe(TOKEN);
    expect(parseRemangaSessionValue(`auth:token=${TOKEN}`)).toBe(TOKEN);
    expect(parseRemangaSessionValue(`other=1; auth:token=${TOKEN}; preference=0`)).toBe(TOKEN);
    const jar = await createRemangaSessionJar(DOMAIN, TOKEN);
    expect(
      await getRemangaSessionToken(CookieJar.deserializeSync(await jar.serialize()), DOMAIN),
    ).toBe(TOKEN);
  });
  it.each([
    '',
    'short',
    'unrelated=value; other=cookie',
    'bad\r\nAuthorization: value',
    '%invalid',
  ])('rejects an invalid cookie: %s', (value) => {
    expect(parseRemangaSessionValue(value)).toBeNull();
  });
  it('validates the authenticated viewer response', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/api/v2/users/current/', { username: 'reader' });
    await expect(fetchRemangaViewer(http, DOMAIN, TOKEN)).rejects.toBeInstanceOf(ParseError);
  });
});

import { CookieJar } from 'tough-cookie';
import { describe, expect, it, vi } from 'vitest';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  SOURCE_AUTH_FAMILY,
  SOURCE_CATALOG,
  SOURCE_LOGIN_REQUIREMENT,
  TITLE_TYPE,
} from '@tanuki/contracts';
import type { ParserContext } from '../src/core/parser';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { generateUid } from '../src/core/uid';
import {
  ParseError,
  SourceAuthRequiredError,
  SourceBlockedError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import { createRegistry } from '../src/registry';
import { SOURCE_ID } from '../src/sources/catalog';
import { createWaMangaParser } from '../src/sources/wamanga';
import {
  fetchWaMangaSessionJson,
  loginWaManga,
  saveWaMangaTokens,
} from '../src/sources/wamanga/auth';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'wamanga.example';
const API = `https://${DOMAIN}/api/v1`;
const TOKENS = {
  access_token: 'test-wamanga-access-token',
  refresh_token: 'test-wamanga-refresh-token',
};
const NEXT_TOKENS = {
  access_token: 'next-wamanga-access-token',
  refresh_token: 'next-wamanga-refresh-token',
};
// Fields consumed by the public library/CSV client, checked 2026-10-31.
const ENTRY = {
  mangaId: 'manga-id',
  slug: 'one-piece',
  title: 'Ван-Пис',
  type: 'manga',
  coverUrl: '/covers/one-piece.webp',
  status: 'reading',
  favorite: false,
  chapterPosition: '123.5',
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
const createJar = async () => {
  const jar = new CookieJar();
  await saveWaMangaTokens(jar, DOMAIN, TOKENS);
  return CookieJar.deserializeSync(await jar.serialize());
};
const withAccount = async <T>(fn: () => Promise<T>) =>
  runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.WAMANGA]: { jar: await createJar() } }, fn);
const importBookmarks = (http: FakeHttpClient) =>
  createWaMangaParser(makeContext(http)).getBookmarks!();

describe('WaManga bookmarks import', () => {
  it('reads every page and keeps catalog identifiers, fractional progress and favorites', async () => {
    const http = new FakeHttpClient();
    registerJson(
      http,
      '/user/library?limit=50&offset=0',
      Array.from({ length: 50 }, (_, i) => ({
        ...ENTRY,
        mangaId: `manga-${i}`,
        slug: `title-${i}`,
      })),
    );
    registerJson(http, '/user/library?limit=50&offset=50', [
      { ...ENTRY, favorite: true },
      {
        ...ENTRY,
        mangaId: 'favorite-only',
        status: null,
        favorite: true,
        chapterPosition: 0,
        coverUrl: null,
      },
      { ...ENTRY, mangaId: 'history-only', status: null },
      { ...ENTRY, mangaId: 'manga-0', slug: 'title-0' },
    ]);
    const folders = await withAccount(() => importBookmarks(http));
    const favorites = folders.find(({ builtIn }) => builtIn === BUILT_IN_BOOKMARK_FOLDER.FAVORITE)!;
    const reading = folders.find(({ builtIn }) => builtIn === BUILT_IN_BOOKMARK_FOLDER.READING)!;
    expect(reading.items).toHaveLength(51);
    expect(favorites.items).toHaveLength(2);
    expect(folders[0]).toBe(favorites);
    expect(favorites.items[0]).toEqual({
      id: generateUid(SOURCE_ID.WAMANGA, ENTRY.mangaId),
      url: 'manga,,one-piece',
      title: ENTRY.title,
      coverUrl: `https://${DOMAIN}${ENTRY.coverUrl}`,
      contentRating: null,
      type: TITLE_TYPE.MANGA,
      lastChapterNumber: 123.5,
      lastChapterVolume: null,
    });
    expect(favorites.items[1]).toMatchObject({ coverUrl: null, lastChapterNumber: 0 });
    expect(http.requests).toHaveLength(2);
    expect(
      http.requests.every(
        ({ url, headers }) =>
          url.startsWith(API) && headers.Authorization === `Bearer ${TOKENS.access_token}`,
      ),
    ).toBe(true);
  });

  it('maps all five statuses to the built-in folders', async () => {
    const http = new FakeHttpClient();
    const statuses = ['reading', 'completed', 'planned', 'on_hold', 'dropped'];
    registerJson(
      http,
      '/user/library?limit=50&offset=0',
      statuses.map((status) => ({ ...ENTRY, mangaId: status, status })),
    );
    const folders = await withAccount(() => importBookmarks(http));
    expect(folders.filter(({ items }) => items.length).map(({ builtIn }) => builtIn)).toEqual([
      BUILT_IN_BOOKMARK_FOLDER.READING,
      BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
      BUILT_IN_BOOKMARK_FOLDER.PLANNED,
      BUILT_IN_BOOKMARK_FOLDER.ON_HOLD,
      BUILT_IN_BOOKMARK_FOLDER.DROPPED,
    ]);
  });

  it.each([null, '', ' ', 'not-a-number', -1, true])(
    'does not invent a chapter from %s',
    async (chapterPosition) => {
      const http = new FakeHttpClient();
      registerJson(http, '/user/library?limit=50&offset=0', [{ ...ENTRY, chapterPosition }]);
      const folders = await withAccount(() => importBookmarks(http));
      expect(folders.flatMap(({ items }) => items)[0]!.lastChapterNumber).toBeNull();
    },
  );

  it('does not borrow the guest or another source account', async () => {
    const http = new FakeHttpClient();
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.TOMILOLIB]: { jar: await createJar() } },
      async () => {
        await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceAuthRequiredError);
      },
    );
    expect(http.requests).toEqual([]);
  });

  it('returns empty folders for an empty library', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/user/library?limit=50&offset=0', []);
    const folders = await withAccount(() => importBookmarks(http));
    expect(folders).toHaveLength(6);
    expect(folders.every(({ items }) => items.length === 0)).toBe(true);
  });

  it.each([
    {},
    { data: [] },
    [null],
    [{ ...ENTRY, status: 'unknown' }],
    [{ ...ENTRY, mangaId: null }],
  ])('rejects a malformed library instead of returning an empty one', async (body) => {
    const http = new FakeHttpClient();
    registerJson(http, '/user/library?limit=50&offset=0', body);
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
  });

  it('does not return a partial library when a later page fails', async () => {
    const http = new FakeHttpClient();
    registerJson(
      http,
      '/user/library?limit=50&offset=0',
      Array.from({ length: 50 }, (_, i) => ({ ...ENTRY, mangaId: String(i) })),
    );
    registerJson(http, '/user/library?limit=50&offset=50', {}, 503);
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });

  it('stops a source that repeats a full page', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url.startsWith(`${API}/user/library?`), {
      status: 200,
      body: JSON.stringify(
        Array.from({ length: 50 }, (_, i) => ({ ...ENTRY, mangaId: String(i) })),
      ),
    });
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
    expect(http.requests).toHaveLength(2);
  });

  it('advertises account linking and import through the registry', async () => {
    const registry = createRegistry({
      credentials: {},
      logger: makeContext(new FakeHttpClient()).logger,
    });
    try {
      expect(registry.get(SOURCE_ID.WAMANGA).info).toMatchObject({
        isBookmarksImportSupported: true,
      });
      expect(SOURCE_CATALOG.wamanga).toMatchObject({
        authFamily: SOURCE_AUTH_FAMILY.WAMANGA,
        loginRequirement: SOURCE_LOGIN_REQUIREMENT.OPTIONAL,
      });
    } finally {
      await registry.close();
    }
  });
});

describe('WaManga account session', () => {
  it('logs in using username/password and reads the documented token pair', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/auth/login', TOKENS);
    expect(
      await loginWaManga(http, DOMAIN, { username: 'reader', password: 'test-password' }),
    ).toEqual(TOKENS);
    expect(JSON.parse(http.requests[0]!.body!)).toEqual({
      username: 'reader',
      password: 'test-password',
    });
  });

  it.each([401, 404])('treats login HTTP %s as rejected credentials', async (status) => {
    const http = new FakeHttpClient();
    registerJson(http, '/auth/login', {}, status);
    expect(
      await loginWaManga(http, DOMAIN, { username: 'reader', password: 'test-password' }),
    ).toBeNull();
  });

  it('rejects a malformed token pair', async () => {
    const http = new FakeHttpClient();
    registerJson(http, '/auth/login', { access_token: TOKENS.access_token });
    await expect(
      loginWaManga(http, DOMAIN, { username: 'reader', password: 'test-password' }),
    ).rejects.toBeInstanceOf(ParseError);
  });

  it('refreshes once for simultaneous requests and persists the rotated pair', async () => {
    const http = new FakeHttpClient();
    const jar = await createJar();
    const onChange = vi.fn();
    http.register(
      (url) => url === `${API}/user/library`,
      () => ({
        status:
          http.requests.at(-1)!.headers.Authorization === `Bearer ${NEXT_TOKENS.access_token}`
            ? 200
            : 401,
        body: '[]',
      }),
    );
    registerJson(http, '/auth/refresh', NEXT_TOKENS);
    await runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.WAMANGA]: { jar, onChange } }, async () => {
      await Promise.all([
        fetchWaMangaSessionJson(makeContext(http), '/user/library'),
        fetchWaMangaSessionJson(makeContext(http), '/user/library'),
      ]);
      await fetchWaMangaSessionJson(makeContext(http), '/user/library');
    });
    const refreshes = http.requests.filter(({ url }) => url.endsWith('/auth/refresh'));
    expect(refreshes).toHaveLength(1);
    expect(JSON.parse(refreshes[0]!.body!)).toEqual({ token: TOKENS.refresh_token });
    expect(refreshes[0]!.headers.Authorization).toBe(`Bearer ${TOKENS.access_token}`);
    expect(onChange).toHaveBeenCalledOnce();
    expect((await jar.getCookies(`https://${DOMAIN}/`)).map(({ value }) => value)).toEqual(
      expect.arrayContaining(Object.values(NEXT_TOKENS)),
    );
  });

  it.each([401, 403])(
    'reports expired HTTP %s as a login failure when renewal is rejected',
    async (status) => {
      const http = new FakeHttpClient();
      registerJson(http, '/user/library?limit=50&offset=0', {}, status);
      registerJson(http, '/auth/refresh', {}, 401);
      await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(
        SourceTokenExpiredError,
      );
    },
  );

  it('logs in again only when the user saved a password and refresh was rejected', async () => {
    const http = new FakeHttpClient();
    const jar = await createJar();
    http.register(
      (url) => url === `${API}/user/library`,
      () => ({
        status:
          http.requests.at(-1)!.headers.Authorization === `Bearer ${NEXT_TOKENS.access_token}`
            ? 200
            : 401,
        body: '[]',
      }),
    );
    registerJson(http, '/auth/refresh', {}, 401);
    registerJson(http, '/auth/login', NEXT_TOKENS);
    await runWithSourceAccounts(
      {
        [SOURCE_AUTH_FAMILY.WAMANGA]: {
          jar,
          credentials: { username: 'reader', password: 'saved-password' },
        },
      },
      () => fetchWaMangaSessionJson(makeContext(http), '/user/library'),
    );
    expect(JSON.parse(http.requests.find(({ url }) => url.endsWith('/auth/login'))!.body!)).toEqual(
      { username: 'reader', password: 'saved-password' },
    );
  });

  it('keeps antibot failures distinct from an expired session', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url.startsWith(`${API}/user/library?`), {
      status: 403,
      body: '<title>Just a moment</title>',
    });
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(
      SourceBlockedError,
    );
    expect(http.requests).toHaveLength(1);
  });
});

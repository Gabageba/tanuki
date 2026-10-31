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
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import { createRegistry } from '../src/registry';
import { SOURCE_ID } from '../src/sources/catalog';
import { createTomiloLibParser } from '../src/sources/tomilolib';
import {
  fetchTomiloLibSessionJson,
  loginTomiloLib,
  saveTomiloLibTokens,
} from '../src/sources/tomilolib/auth';
import type { TomiloLibTokens } from '../src/sources/tomilolib/models';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'tomilo-lib.example';
const API = `https://${DOMAIN}/api`;
const TOKENS = {
  access_token: 'test-tomilo-access-token',
  refresh_token: 'test-tomilo-refresh-token',
};
const NEXT_TOKENS = {
  access_token: 'next-tomilo-access-token',
  refresh_token: 'next-tomilo-refresh-token',
};
const TITLE = {
  _id: 'title-1',
  slug: 'one-piece',
  name: 'Ван-Пис',
  coverImage: '/uploads/titles/1/cover.jpg',
  type: 'manga',
};
const HISTORY_PATH = '/users/profile/history?page=1&limit=100&light=false';
const makeContext = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const json = (http: FakeHttpClient, path: string, body: unknown, status = 200) =>
  http.register((url) => url === `${API}${path}`, {
    status,
    body: JSON.stringify(body),
    contentType: 'application/json',
  });
const createJar = async (tokens: TomiloLibTokens = TOKENS) => {
  const jar = new CookieJar();
  await saveTomiloLibTokens(jar, DOMAIN, tokens);
  return jar;
};
const withAccount = async <T>(fn: () => Promise<T>) =>
  runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.TOMILOLIB]: { jar: await createJar() } }, fn);
const importBookmarks = (http: FakeHttpClient) =>
  withAccount(() => createTomiloLibParser(makeContext(http)).getBookmarks!());
const profile = (http: FakeHttpClient, bookmarks: unknown[], groups: unknown[] = []) => {
  json(http, '/users/profile', { success: true, data: { bookmarks } });
  json(http, '/users/profile/bookmark-groups', { success: true, data: groups });
};

describe('TomiloLib bookmarks', () => {
  it('maps all built-in categories and custom groups, preserves title identity and chapter numbers across history pages', async () => {
    const http = new FakeHttpClient();
    const categories = ['reading', 'planned', 'completed', 'favorites', 'dropped', 'group:weekend'];
    profile(
      http,
      categories.map((category, index) => ({
        category,
        titleId: { ...TITLE, _id: `title-${index}`, slug: `title-${index}` },
      })),
      [{ id: 'group:weekend', name: 'На выходные' }],
    );
    json(http, HISTORY_PATH, {
      data: {
        items: [
          { titleId: 'title-0', chapters: [{ chapterNumber: 2 }, { chapterNumber: 10.5 }] },
          { titleId: { _id: 'title-1' }, chapters: [{ chapterNumber: 0 }] },
        ],
        pagination: { pages: 2 },
      },
    });
    json(http, '/users/profile/history?page=2&limit=100&light=false', {
      data: [
        { titleId: 'title-0', chapters: [{ chapterNumber: 3 }] },
        { titleId: 'title-5', lastChapter: { chapterNumber: 7 } },
      ],
      pagination: { pages: 2 },
    });
    const folders = await importBookmarks(http);
    expect(folders.map(({ builtIn }) => builtIn)).toEqual([
      BUILT_IN_BOOKMARK_FOLDER.READING,
      BUILT_IN_BOOKMARK_FOLDER.PLANNED,
      BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
      BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
      BUILT_IN_BOOKMARK_FOLDER.DROPPED,
      null,
    ]);
    expect(folders[0]!.items[0]).toMatchObject({
      id: generateUid(SOURCE_ID.TOMILOLIB, '/titles/title-0'),
      url: '/titles/title-0',
      title: TITLE.name,
      coverUrl: 'https://s3.regru.cloud/tomilolib/titles/1/cover.jpg',
      type: TITLE_TYPE.MANGA,
      lastChapterNumber: 10.5,
      lastChapterVolume: null,
    });
    expect(folders[1]!.items[0]!.lastChapterNumber).toBe(0);
    expect(folders[2]!.items[0]!.lastChapterNumber).toBeNull();
    expect(folders[5]).toMatchObject({
      id: 'group:weekend',
      name: 'На выходные',
      items: [{ lastChapterNumber: 7 }],
    });
    expect(
      http.requests.every(
        ({ headers }) => headers.Authorization === `Bearer ${TOKENS.access_token}`,
      ),
    ).toBe(true);
  });

  it('loads legacy ids, reuses snapshots, skips deleted titles and removes duplicates within a folder', async () => {
    const http = new FakeHttpClient();
    profile(http, [
      'legacy',
      { titleId: 'legacy', category: 'reading' },
      { titleId: 'title-1', title: TITLE, category: 'favorites' },
      { titleId: null },
      'deleted',
    ]);
    json(http, HISTORY_PATH, { data: [] });
    json(http, '/titles/legacy?populateChapters=false', {
      data: { ...TITLE, _id: 'legacy', slug: 'legacy' },
    });
    json(http, '/titles/deleted?populateChapters=false', {}, 404);
    const folders = await importBookmarks(http);
    expect(folders[0]!.items.map(({ url }) => url)).toEqual(['/titles/legacy']);
    expect(folders[3]!.items.map(({ url }) => url)).toEqual(['/titles/one-piece']);
    expect(http.requests.filter(({ url }) => url.includes('/titles/legacy'))).toHaveLength(1);
  });

  it('accepts an empty library without fetching reading history', async () => {
    const http = new FakeHttpClient();
    profile(http, []);
    expect((await importBookmarks(http)).every(({ items }) => items.length === 0)).toBe(true);
    expect(http.requests).toHaveLength(2);
  });

  it('requires the caller’s own account, even if another family is linked', async () => {
    const http = new FakeHttpClient();
    const parser = createTomiloLibParser(makeContext(http));
    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.REMANGA]: { jar: await createJar() } },
      async () => {
        await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
      },
    );
    expect(http.requests).toEqual([]);
  });

  it('does not import a partial library if a later history page fails', async () => {
    const http = new FakeHttpClient();
    profile(http, [{ titleId: TITLE }]);
    json(http, HISTORY_PATH, {
      data: { items: [{ titleId: 'title-1', chapters: [] }], pagination: { pages: 2 } },
    });
    json(http, '/users/profile/history?page=2&limit=100&light=false', {}, 503);
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceUnavailableError);
  });

  it.each([
    { path: '/users/profile', body: { data: {} } },
    { path: '/users/profile/bookmark-groups', body: { data: {} } },
    { path: '/users/profile/bookmark-groups', body: { data: [{ id: 'group:bad' }] } },
    { path: HISTORY_PATH, body: { data: {} } },
    { path: HISTORY_PATH, body: { success: false, data: [] } },
    { path: HISTORY_PATH, body: { data: { items: [], pagination: { pages: 2 } } } },
  ])('rejects malformed $path instead of reporting an empty library', async ({ path, body }) => {
    const http = new FakeHttpClient();
    json(http, path, body);
    profile(http, [{ titleId: TITLE }]);
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(ParseError);
  });

  it('does not silently drop an unknown folder', async () => {
    const http = new FakeHttpClient();
    profile(http, [{ titleId: TITLE, category: 'group:missing' }]);
    json(http, HISTORY_PATH, { data: [] });
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(ParseError);
  });

  it('advertises optional account linking and import through the registry', async () => {
    const registry = createRegistry({
      credentials: {},
      logger: makeContext(new FakeHttpClient()).logger,
    });
    try {
      expect(registry.get(SOURCE_ID.TOMILOLIB).info).toMatchObject({
        isBookmarksImportSupported: true,
      });
      expect(SOURCE_CATALOG.tomilolib).toMatchObject({
        authFamily: SOURCE_AUTH_FAMILY.TOMILOLIB,
        loginRequirement: SOURCE_LOGIN_REQUIREMENT.OPTIONAL,
      });
    } finally {
      await registry.close();
    }
  });
});

describe('TomiloLib session', () => {
  it('logs in with email and password and accepts wrapped or unwrapped token responses', async () => {
    for (const body of [{ success: true, data: TOKENS }, TOKENS]) {
      const http = new FakeHttpClient();
      json(http, '/auth/login', body);
      expect(
        await loginTomiloLib(http, DOMAIN, { username: 'reader@example.com', password: 'secret' }),
      ).toEqual(TOKENS);
      expect(JSON.parse(http.requests[0]!.body!)).toEqual({
        email: 'reader@example.com',
        password: 'secret',
      });
    }
  });

  it('distinguishes a rejected password from source outages and malformed responses', async () => {
    const credentials = { username: 'reader@example.com', password: 'secret' };
    const rejected = new FakeHttpClient();
    json(rejected, '/auth/login', { success: false }, 401);
    await expect(loginTomiloLib(rejected, DOMAIN, credentials)).resolves.toBeNull();
    const unavailable = new FakeHttpClient();
    json(unavailable, '/auth/login', {}, 503);
    await expect(loginTomiloLib(unavailable, DOMAIN, credentials)).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
    const malformed = new FakeHttpClient();
    json(malformed, '/auth/login', {
      data: { access_token: 'bad\r\nheader', refresh_token: TOKENS.refresh_token },
    });
    await expect(loginTomiloLib(malformed, DOMAIN, credentials)).rejects.toBeInstanceOf(ParseError);
  });

  it('refreshes a session once for concurrent requests, persists rotated tokens and retries with the new token', async () => {
    const http = new FakeHttpClient();
    let requests = 0;
    http.register(
      (url) => url === `${API}/users/profile`,
      () => ({
        status: ++requests <= 2 ? 401 : 200,
        body: JSON.stringify({ data: { bookmarks: [] } }),
        contentType: 'application/json',
      }),
    );
    json(http, '/auth/refresh', { data: NEXT_TOKENS });
    const jar = await createJar();
    const onChange = vi.fn();
    await runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.TOMILOLIB]: { jar, onChange } }, async () => {
      await Promise.all(
        [1, 2].map(() => fetchTomiloLibSessionJson(makeContext(http), '/users/profile')),
      );
    });
    expect(http.requests.filter(({ url }) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(http.requests.slice(-2).map(({ headers }) => headers.Authorization)).toEqual([
      `Bearer ${NEXT_TOKENS.access_token}`,
      `Bearer ${NEXT_TOKENS.access_token}`,
    ]);
    expect(onChange).toHaveBeenCalledOnce();
    const restored = CookieJar.deserializeSync(await jar.serialize());
    expect((await restored.getCookies(`https://${DOMAIN}/`)).map(({ value }) => value)).toEqual(
      Object.values(NEXT_TOKENS),
    );
  });

  it('uses a saved password only after refresh is rejected', async () => {
    const http = new FakeHttpClient();
    let requests = 0;
    http.register(
      (url) => url === `${API}/users/profile`,
      () => ({ status: ++requests === 1 ? 401 : 200, body: '{}' }),
    );
    json(http, '/auth/refresh', {}, 401);
    json(http, '/auth/login', { data: NEXT_TOKENS });
    await runWithSourceAccounts(
      {
        [SOURCE_AUTH_FAMILY.TOMILOLIB]: {
          jar: await createJar(),
          credentials: { username: 'reader@example.com', password: 'secret' },
        },
      },
      () => fetchTomiloLibSessionJson(makeContext(http), '/users/profile'),
    );
    expect(http.requests.map(({ url }) => url)).toEqual([
      `${API}/users/profile`,
      `${API}/auth/refresh`,
      `${API}/auth/login`,
      `${API}/users/profile`,
    ]);
  });

  it('reports an expired session instead of an empty library when refresh fails', async () => {
    const http = new FakeHttpClient();
    json(http, '/users/profile', {}, 401);
    json(http, '/auth/refresh', {}, 401);
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceTokenExpiredError);
  });
});

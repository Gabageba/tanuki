import { CookieJar } from 'tough-cookie';
import { describe, expect, it, vi } from 'vitest';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  SOURCE_AUTH_FAMILY,
  SOURCE_CATALOG,
} from '@tanuki/contracts';
import type { ParserContext } from '../src/core/parser';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { HttpClientImpl } from '../src/core/http/client';
import { generateUid } from '../src/core/uid';
import {
  ParseError,
  SourceAuthRequiredError,
  SourceBlockedError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import { createRegistry } from '../src/registry';
import { createHentaichanCcParser } from '../src/sources/hentaichancc';
import {
  createHentaichanCcSessionJar,
  fetchHentaichanCcViewer,
  parseHentaichanCcSessionValue,
} from '../src/sources/hentaichancc/auth';
import { HENTAICHAN_CC_SESSION_COOKIE } from '../src/sources/hentaichancc/models';
import { SOURCE_ID } from '../src/sources/catalog';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'hentaichan.example';
const ORIGIN = `https://${DOMAIN}`;
const USER_ID = '11111111-2222-3333-4444-555555555555';
const PROFILE = `${ORIGIN}/profile/${USER_ID}`;
// Next.js includes a metadata byte before the 40-character action hash.
const LIKES_ACTION = `7f${'a'.repeat(40)}`;
const HISTORY_ACTION = `7f${'b'.repeat(40)}`;
const SESSION = {
  user: { id: 'auth-id', directusId: USER_ID, name: 'reader' },
  session: { expiresAt: '2099-01-01T00:00:00Z' },
};
const MANGA = {
  id: 6640,
  name: 'Тестовый релиз',
  slug: 'test-release',
  src: 'https://cdn.hentaichan.cc/test.jpg',
};

const context = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const withAccount = <T>(fn: () => Promise<T>) =>
  runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.HENTAICHAN_CC]: { jar: new CookieJar() } }, fn);
const importBookmarks = (http: FakeHttpClient) =>
  createHentaichanCcParser(context(http)).getBookmarks!();
const registerSession = (http: FakeHttpClient, data: unknown = SESSION, status = 200) =>
  http.register((url) => url === `${ORIGIN}/api/auth/get-session?disableCookieCache=true`, {
    status,
    body: JSON.stringify(data),
  });
const registerProfile = (
  http: FakeHttpClient,
  actions = true,
  likesAction = LIKES_ACTION,
  historyAction = HISTORY_ACTION,
) => {
  registerSession(http);
  http.register((url, body) => url === PROFILE && body === undefined, {
    status: 200,
    body: '<script src="https://untrusted.example/script.js"></script><script src="/_next/static/chunks/profile.js"></script>',
  });
  http.register((url) => url === `${ORIGIN}/_next/static/chunks/profile.js`, {
    status: 200,
    body: actions
      ? `(0,A.createServerReference)("${likesAction}",A.callServer,void 0,A.findSourceMapURL,"getProfileLikes");(0,A.createServerReference)("${historyAction}",A.callServer,void 0,A.findSourceMapURL,"getProfileHistory")`
      : '',
  });
};
const actionResponse = (data: unknown) => `0:{"a":"$@a","f":[]}\na:${JSON.stringify({ data })}\n`;
const registerFeeds = (http: FakeHttpClient, likes = [MANGA], history = [MANGA]) =>
  http.register(
    (url, body) => url === PROFILE && body !== undefined,
    () => ({
      status: 200,
      body: actionResponse({
        count: 1,
        manga: http.requests.at(-1)!.headers['Next-Action'] === LIKES_ACTION ? likes : history,
      }),
    }),
  );
const registerProgress = (http: FakeHttpClient, page: number) => {
  http.register((url) => url === `${ORIGIN}/api/manga/${MANGA.id}/engagement`, {
    status: 200,
    body: JSON.stringify({ success: true, data: { historyPage: page } }),
  });
  http.register((url) => url.startsWith('https://backend.hentaichan.cc/items/chapters?'), {
    status: 200,
    body: JSON.stringify({
      data: [
        { id: 10, pages: [1, 2, 3] },
        { id: 20, pages: [4, 5] },
      ],
    }),
  });
};

describe('HentaiChan import', () => {
  it.each([40, 42])(
    'discovers %s-character action identifiers from the profile bundle',
    async (length) => {
      const http = new FakeHttpClient();
      const likesAction = 'a'.repeat(length);
      const historyAction = 'b'.repeat(length);
      registerProfile(http, true, likesAction, historyAction);
      http.register((url, body) => url === PROFILE && body !== undefined, {
        status: 200,
        body: actionResponse({ count: 0, manga: [] }),
      });
      await withAccount(() => importBookmarks(http));
      expect(
        http.requests.filter(({ body }) => body).map(({ headers }) => headers['Next-Action']),
      ).toEqual([likesAction, historyAction]);
    },
  );

  it('imports likes before history, keeps catalog ids and maps a global page to chapter/page', async () => {
    const http = new FakeHttpClient();
    registerProfile(http);
    registerFeeds(http);
    registerProgress(http, 5);
    const folders = await withAccount(() => importBookmarks(http));
    expect(folders.map(({ id, builtIn }) => ({ id, builtIn }))).toEqual([
      { id: 'likes', builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE },
      { id: 'history', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING },
    ]);
    expect(folders[0]!.items[0]).toEqual({
      id: generateUid(SOURCE_ID.HENTAICHAN_CC, MANGA.id),
      url: '6640,,test-release',
      title: MANGA.name,
      coverUrl: MANGA.src,
      contentRating: CONTENT_RATING.ADULT,
      type: null,
      lastChapterNumber: 2,
      lastChapterVolume: null,
      lastPageIndex: 1,
    });
    expect(folders[1]!.items).toEqual(folders[0]!.items);
    expect(http.requests.filter(({ url }) => url.endsWith('/engagement'))).toHaveLength(1);
    expect(http.requests.some(({ url }) => url.startsWith('https://untrusted.example'))).toBe(
      false,
    );
    expect(
      http.requests.filter(({ body }) => body).map(({ headers }) => headers['Next-Action']),
    ).toEqual([LIKES_ACTION, HISTORY_ACTION]);
  });

  it('reads all pages of both feeds and deduplicates overlapping pages', async () => {
    const http = new FakeHttpClient();
    registerProfile(http);
    http.register(
      (url, body) => url === PROFILE && body !== undefined,
      () => {
        const request = http.requests.at(-1)!;
        const [{ page }] = JSON.parse(request.body!) as [{ page: number }];
        const manga = page === 1 ? [MANGA] : [MANGA, { ...MANGA, id: 6641 }];
        return { status: 200, body: actionResponse({ count: 2, manga }) };
      },
    );
    http.register((url) => url.endsWith('/engagement'), {
      status: 200,
      body: JSON.stringify({ success: true, data: { historyPage: 0 } }),
    });
    const folders = await withAccount(() => importBookmarks(http));
    expect(folders.map(({ items }) => items.length)).toEqual([2, 2]);
    expect(folders[0]!.items[0]).toMatchObject({ lastChapterNumber: null, lastPageIndex: null });
    expect(http.requests.filter(({ body }) => body)).toHaveLength(4);
  });

  it('does not borrow a service account or another source session', async () => {
    const http = new FakeHttpClient();
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.SENKURO]: { jar: new CookieJar() } },
      async () => {
        await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceAuthRequiredError);
      },
    );
    expect(http.requests).toHaveLength(0);
  });

  it('returns empty folders without requesting progress', async () => {
    const http = new FakeHttpClient();
    registerProfile(http);
    http.register((url, body) => url === PROFILE && body !== undefined, {
      status: 200,
      body: actionResponse({ count: 0, manga: [] }),
    });
    expect(
      (await withAccount(() => importBookmarks(http))).every(({ items }) => items.length === 0),
    ).toBe(true);
    expect(http.requests.some(({ url }) => url.endsWith('/engagement'))).toBe(false);
  });

  it.each([
    null,
    { count: 1, manga: [null] },
    { count: -1, manga: [] },
    { count: 1, manga: [{ ...MANGA, id: '6640' }] },
  ])('rejects malformed feeds: %s', async (data) => {
    const http = new FakeHttpClient();
    registerProfile(http);
    http.register((url, body) => url === PROFILE && body !== undefined, {
      status: 200,
      body: actionResponse(data),
    });
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
  });

  it('stops repeating pages instead of returning a partial library', async () => {
    const http = new FakeHttpClient();
    registerProfile(http);
    http.register((url, body) => url === PROFILE && body !== undefined, {
      status: 200,
      body: actionResponse({ count: 10, manga: [MANGA] }),
    });
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
    expect(http.requests.filter(({ body }) => body)).toHaveLength(2);
  });

  it('fails when the source no longer exposes its actions', async () => {
    const http = new FakeHttpClient();
    registerProfile(http, false);
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
  });

  it('does not return likes when the history or progress request fails', async () => {
    const http = new FakeHttpClient();
    registerProfile(http);
    registerFeeds(http);
    http.register((url) => url.endsWith('/engagement'), { status: 503, body: 'Unavailable' });
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });

  it('advertises linking and import through the registry', async () => {
    const registry = createRegistry({
      credentials: {},
      logger: context(new FakeHttpClient()).logger,
    });
    try {
      expect(registry.get(SOURCE_ID.HENTAICHAN_CC).info.isBookmarksImportSupported).toBe(true);
      expect(SOURCE_CATALOG.hentaichan_cc.authFamily).toBe(SOURCE_AUTH_FAMILY.HENTAICHAN_CC);
    } finally {
      await registry.close();
    }
  });
});

describe('HentaiChan session', () => {
  it('accepts the signed value, a cookie pair or a Cookie header without decoding it', async () => {
    const value = 'token.signature%2Fvalue%3D';
    for (const input of [
      value,
      `${HENTAICHAN_CC_SESSION_COOKIE}=${value}`,
      `other=x; ${HENTAICHAN_CC_SESSION_COOKIE}=${value}; other2=y`,
    ])
      expect(parseHentaichanCcSessionValue(input)).toBe(value);
    expect(parseHentaichanCcSessionValue('bad\nvalue')).toBeNull();
    const jar = CookieJar.deserializeSync(
      await (await createHentaichanCcSessionJar(DOMAIN, value)).serialize(),
    );
    expect(await jar.getCookieString(ORIGIN)).toBe(`${HENTAICHAN_CC_SESSION_COOKIE}=${value}`);
    expect(await jar.getCookieString('https://other.example')).toBe('');
  });

  it.each([null, { ...SESSION, session: { expiresAt: '2000-01-01T00:00:00Z' } }])(
    'rejects expired sessions',
    async (data) => {
      const http = new FakeHttpClient();
      registerSession(http, data);
      await expect(fetchHentaichanCcViewer(http, DOMAIN)).rejects.toBeInstanceOf(
        SourceTokenExpiredError,
      );
    },
  );

  it('keeps malformed responses and antibot failures distinct from an expired session', async () => {
    const http = new FakeHttpClient();
    registerSession(http, {});
    await expect(fetchHentaichanCcViewer(http, DOMAIN)).rejects.toBeInstanceOf(ParseError);
    const blocked = new FakeHttpClient();
    blocked.register(() => true, { status: 403, body: '<title>Just a moment</title>' });
    await expect(fetchHentaichanCcViewer(blocked, DOMAIN)).rejects.toBeInstanceOf(
      SourceBlockedError,
    );
  });

  it('links the verified session and returns the source account name', async () => {
    const fake = new FakeHttpClient();
    fake.register((url) => url.startsWith('https://hentaichan.cc/api/auth/get-session'), {
      status: 200,
      body: JSON.stringify(SESSION),
    });
    const request = vi
      .spyOn(HttpClientImpl.prototype, 'request')
      .mockImplementation((req) => fake.request(req));
    const registry = createRegistry({ credentials: {}, logger: context(fake).logger });
    try {
      const linked = await registry.linkSession(
        SOURCE_AUTH_FAMILY.HENTAICHAN_CC,
        'token.signature',
      );
      expect(linked?.login).toBe('reader');
      expect(await linked?.jar.getCookieString('https://hentaichan.cc')).toBe(
        `${HENTAICHAN_CC_SESSION_COOKIE}=token.signature`,
      );
    } finally {
      request.mockRestore();
      await registry.close();
    }
  });
});

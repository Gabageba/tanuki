import { CookieJar } from 'tough-cookie';
import { describe, expect, it, vi } from 'vitest';
import { BUILT_IN_BOOKMARK_FOLDER, CONTENT_RATING, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { ParserContext } from '../src/core/parser';
import { generateUid } from '../src/core/uid';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import {
  ParseError,
  SourceAuthRequiredError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import { createRegistry } from '../src/registry';
import { createNudeMoonParser } from '../src/sources/nudemoon';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';

const DOMAIN = 'nude-moon.example';
const ORIGIN = `https://${DOMAIN}`;
const EMPTY_PAGE = `<h1>Избранное </h1><table><tr><td class="main-body">
  Показывать как: [<a href="/favorites">список</a>] [<a href="/favorites?table">таблица</a>]
  <table class="textbox"><tr></tr></table></td></tr></table>`;
const GUEST_PAGE = '<form name="loginform" action="/setuser.php"></form>';
const context = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const withAccount = <T>(fn: () => Promise<T>) =>
  runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.NUDEMOON]: { jar: new CookieJar() } }, fn);
const importBookmarks = (http: FakeHttpClient) =>
  createNudeMoonParser(context(http)).getBookmarks!();
const registerPage = (http: FakeHttpClient, body: string, status = 200) =>
  http.register((url) => url === `${ORIGIN}/favorites?table`, { status, body });

describe('Nude-Moon bookmarks', () => {
  it('reads the live grid markup and preserves the catalog identity without inventing progress', async () => {
    const http = new FakeHttpClient();
    registerPage(http, readFixture('nudemoon-favorites.html'));
    const folders = await withAccount(() => importBookmarks(http));
    expect(folders).toEqual([
      {
        id: 'favorites',
        name: 'Избранное',
        builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
        items: [
          {
            id: generateUid('nudemoon', '/12345--author-saved-title.html'),
            url: '/12345--author-saved-title.html',
            title: 'Сохранённый тайтл',
            coverUrl: `${ORIGIN}/images/thumb/2610/315-87.jpg`,
            contentRating: CONTENT_RATING.ADULT,
            type: null,
            lastChapterNumber: null,
            lastChapterVolume: null,
            lastPageIndex: null,
          },
        ],
      },
    ]);
  });

  it('reads every grid cell and row, deduplicates titles, supports lazy covers and absent covers', async () => {
    const http = new FakeHttpClient();
    registerPage(
      http,
      EMPTY_PAGE.replace(
        '<tr></tr>',
        `<tr>
      <td><a href="/1-first.html" title="Первый"></a><img data-src="/lazy.jpg" src="/placeholder.jpg"></td>
      <td><a href="/2-second.html">Второй &amp; другой</a></td>
    </tr><tr>
      <td><a href="/1-first.html" title="Первый"></a></td>
      <td><a href="/3-third.html" title="Третий"></a></td>
    </tr>`,
      ),
    );
    const [folder] = await withAccount(() => importBookmarks(http));
    expect(folder!.items.map((item) => item.title)).toEqual([
      'Первый',
      'Второй & другой',
      'Третий',
    ]);
    expect(folder!.items.map((item) => item.coverUrl)).toEqual([`${ORIGIN}/lazy.jpg`, null, null]);
  });

  it.each([
    '<td><a href="favorites?del=12&table">X</a></td>',
    '<td><a href="/1-title.html"></a></td>',
    '<th><a href="/1-title.html">Changed grid</a></th>',
  ])('rejects a malformed bookmark instead of silently omitting it: %s', async (cell) => {
    const http = new FakeHttpClient();
    registerPage(http, EMPTY_PAGE.replace('<tr></tr>', `<tr>${cell}</tr>`));
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
  });

  it('requires a viewer account, never falls back to the service account', async () => {
    const http = new FakeHttpClient();
    const ctx = context(http);
    ctx.credentials.nudemoon = { username: 'service', password: 'service-password' };
    const parser = createNudeMoonParser(ctx);
    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await expect(
      runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.NUDEMOON]: {} }, parser.getBookmarks!),
    ).rejects.toBeInstanceOf(SourceAuthRequiredError);
    expect(http.requests).toHaveLength(0);
  });

  it('recognizes the live empty table', async () => {
    const http = new FakeHttpClient();
    registerPage(http, EMPTY_PAGE);
    await expect(withAccount(() => importBookmarks(http))).resolves.toEqual([
      { id: 'favorites', name: 'Избранное', builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE, items: [] },
    ]);
  });

  it('rejects an expired session instead of importing an empty list', async () => {
    const http = new FakeHttpClient();
    registerPage(http, GUEST_PAGE);
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(
      SourceTokenExpiredError,
    );
  });

  it('relogs in once and persists the renewed session', async () => {
    const http = new FakeHttpClient();
    const jar = new CookieJar();
    const onChange = vi.fn();
    let loggedIn = false;
    http.register(
      (url) => url === `${ORIGIN}/favorites?table`,
      () => ({ status: 200, body: loggedIn ? EMPTY_PAGE : GUEST_PAGE }),
    );
    http.register(
      (url) => url === `${ORIGIN}/setuser.php`,
      () => {
        jar.setCookieSync(`fusion_user=renewed; Path=/`, ORIGIN);
        loggedIn = true;
        return { status: 200, body: '' };
      },
    );
    await runWithSourceAccounts(
      {
        [SOURCE_AUTH_FAMILY.NUDEMOON]: {
          jar,
          onChange,
          credentials: { username: 'reader', password: 'password' },
        },
      },
      () => importBookmarks(http),
    );
    expect(onChange).toHaveBeenCalledOnce();
    expect(http.requests.map((r) => new URL(r.url).pathname)).toEqual([
      '/favorites',
      '/setuser.php',
      '/favorites',
    ]);
  });

  it('stops after one retry even when login set a cookie', async () => {
    const http = new FakeHttpClient();
    const jar = new CookieJar();
    registerPage(http, GUEST_PAGE);
    http.register(
      (url) => url === `${ORIGIN}/setuser.php`,
      () => {
        jar.setCookieSync(`fusion_user=rejected; Path=/`, ORIGIN);
        return { status: 200, body: '' };
      },
    );
    await expect(
      runWithSourceAccounts(
        {
          [SOURCE_AUTH_FAMILY.NUDEMOON]: {
            jar,
            credentials: { username: 'reader', password: 'password' },
          },
        },
        () => importBookmarks(http),
      ),
    ).rejects.toBeInstanceOf(SourceTokenExpiredError);
    expect(http.requests).toHaveLength(3);
  });

  it('does not treat markup changes or server errors as an empty library', async () => {
    const malformed = new FakeHttpClient();
    registerPage(malformed, '<h1>Избранное</h1>');
    await expect(withAccount(() => importBookmarks(malformed))).rejects.toBeInstanceOf(ParseError);
    const unavailable = new FakeHttpClient();
    registerPage(unavailable, 'unavailable', 503);
    await expect(withAccount(() => importBookmarks(unavailable))).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });

  it('exposes import support in the registry', async () => {
    const registry = createRegistry({
      credentials: {},
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    });
    try {
      expect(registry.get('nudemoon').getBookmarks).toBeTypeOf('function');
      expect(registry.get('nudemoon').info.isBookmarksImportSupported).toBe(true);
    } finally {
      await registry.close();
    }
  });
});

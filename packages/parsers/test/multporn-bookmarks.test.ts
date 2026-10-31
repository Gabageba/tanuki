import { CookieJar } from 'tough-cookie';
import { describe, expect, it, vi } from 'vitest';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  SOURCE_AUTH_FAMILY,
  catalogEntryFor,
  SOURCE_LOGIN_REQUIREMENT,
} from '@tanuki/contracts';
import type { ParserContext } from '../src/core/parser';
import { HttpClientImpl } from '../src/core/http/client';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { generateUid } from '../src/core/uid';
import {
  ParseError,
  SourceAuthRequiredError,
  SourceTokenExpiredError,
  SourceUnavailableError,
} from '../src/errors';
import { createRegistry } from '../src/registry';
import { MULTPORN_CONFIGS, type MultpornConfig } from '../src/sources/multporn/config';
import { createMultpornParser } from '../src/sources/multporn/engine';
import { loginMultporn } from '../src/sources/multporn/auth';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'multporn.example';
const ORIGIN = `https://${DOMAIN}`;
const CREDENTIALS = { username: 'reader', password: 'test-password' };
const LOGIN_FORM = `<body class="not-logged-in"><form id="user-login">
  <input type="hidden" name="form_build_id" value="form-current-build">
  <input type="hidden" name="form_id" value="user_login">
</form></body>`;
const PROFILE = '<body class="logged-in"><h1 id="page-title">Reader &amp; Co</h1></body>';

const context = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const withAccount = <T>(fn: () => Promise<T>) =>
  runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.MULTPORN]: { jar: new CookieJar() } }, fn);
const importBookmarks = (http: FakeHttpClient, cfg = MULTPORN_CONFIGS[0]!) =>
  createMultpornParser(cfg, context(http)).getBookmarks!();
const row = (path: string, title = 'Saved title') => `<div class="views-row">
  <div class="views-field-title"><a href="${path}">${title}</a></div>
  <div class="views-field-field-preview"><img src="/covers/saved.jpg"></div>
</div>`;
const page = (rows = '', next = false) => `<body class="logged-in">
  <div id="block-system-main"><div class="view view-bookmarks">
    ${rows ? `<div class="view-content">${rows}</div>` : ''}
    ${next ? '<ul class="pager"><li class="pager-next"><a href="?page=1">next</a></li></ul>' : ''}
  </div></div></body>`;
const registerPage = (http: FakeHttpClient, cfg: MultpornConfig, index: number, body: string) =>
  http.register(
    (url) => {
      const parsed = new URL(url);
      return (
        parsed.pathname === '/bookmarks' &&
        parsed.searchParams.get('page') === String(index) &&
        parsed.searchParams.get('type') === cfg.bookmarksType
      );
    },
    { status: 200, body },
  );
const registerLogin = (http: FakeHttpClient, accepted = true) => {
  http.register((url, body) => url === `${ORIGIN}/user/login` && body === undefined, {
    status: 200,
    body: LOGIN_FORM,
  });
  http.register((url, body) => url === `${ORIGIN}/user/login` && body !== undefined, {
    status: 200,
    body: accepted ? PROFILE : LOGIN_FORM,
  });
  http.register((url) => url === `${ORIGIN}/user`, {
    status: 200,
    body: accepted ? PROFILE : LOGIN_FORM,
  });
};

describe('MultPorn bookmarks', () => {
  it.each(MULTPORN_CONFIGS)('$id reads the live custom table fields', async (cfg) => {
    const http = new FakeHttpClient();
    const path = `${cfg.pathPrefix}saved`;
    registerPage(
      http,
      cfg,
      0,
      page(`<table class="default-table views-table cols-4"><tbody><tr>
        <td class="views-field views-field-nothing">
          <a href="${ORIGIN}${path}">Saved &amp; checked</a><br>
          <a href="${path}"><img src="/covers/saved.jpg"></a>
        </td>
        <td class="views-field views-field-nothing-1"><a href="/authors/ignored">Author</a></td>
        <td class="views-field views-field-nothing-3">Description</td>
        <td class="views-field views-field-nothing-2"><a href="/flag/ignored">Remove bookmark</a></td>
      </tr></tbody></table>`),
    );
    const folders = await withAccount(() => importBookmarks(http, cfg));
    expect(folders[0]!.items).toEqual([
      {
        id: generateUid(cfg.id, path),
        url: path,
        title: 'Saved & checked',
        coverUrl: `${ORIGIN}/covers/saved.jpg`,
        contentRating: CONTENT_RATING.ADULT,
        type: null,
        lastChapterNumber: null,
        lastChapterVolume: null,
        lastPageIndex: null,
      },
    ]);
  });

  it.each(MULTPORN_CONFIGS)(
    '$id reads all pages, preserves catalog ids and isolates content types',
    async (cfg) => {
      const http = new FakeHttpClient();
      const first = `${cfg.pathPrefix}first`;
      registerPage(http, cfg, 0, page(row(first) + row('/games/ignored'), true));
      registerPage(
        http,
        cfg,
        1,
        page(row(first) + row(`${cfg.pathPrefix}second`, 'Second &amp; last')),
      );
      const folders = await withAccount(() => importBookmarks(http, cfg));
      expect(folders).toHaveLength(1);
      expect(folders[0]).toMatchObject({
        id: 'bookmarks',
        builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
      });
      expect(folders[0]!.items).toEqual([
        {
          id: generateUid(cfg.id, first),
          url: first,
          title: 'Saved title',
          coverUrl: `${ORIGIN}/covers/saved.jpg`,
          contentRating: CONTENT_RATING.ADULT,
          type: null,
          lastChapterNumber: null,
          lastChapterVolume: null,
          lastPageIndex: null,
        },
        expect.objectContaining({ url: `${cfg.pathPrefix}second`, title: 'Second & last' }),
      ]);
      expect(http.requests).toHaveLength(2);
      expect(http.requests[0]!.url).toContain('sort_by=timestamp&sort_order=ASC');
    },
  );

  it('refuses a shared/service session without making a request', async () => {
    const http = new FakeHttpClient();
    await expect(importBookmarks(http)).rejects.toBeInstanceOf(SourceAuthRequiredError);
    expect(http.requests).toHaveLength(0);
  });

  it('accepts an authenticated empty library and rejects an expired session', async () => {
    const http = new FakeHttpClient();
    registerPage(http, MULTPORN_CONFIGS[0]!, 0, page());
    expect((await withAccount(() => importBookmarks(http)))[0]!.items).toEqual([]);
    const expired = new FakeHttpClient();
    registerPage(expired, MULTPORN_CONFIGS[0]!, 0, LOGIN_FORM);
    await expect(withAccount(() => importBookmarks(expired))).rejects.toBeInstanceOf(
      SourceTokenExpiredError,
    );
  });

  it.each([
    '<body class="logged-in"><h1>Changed layout</h1></body>',
    page('<div class="views-row">Missing title</div>'),
    page('<p>Changed rows</p>'),
    page('<img src="/covers/unrecognized.jpg">'),
  ])('rejects malformed libraries instead of returning a partial import', async (body) => {
    const http = new FakeHttpClient();
    registerPage(http, MULTPORN_CONFIGS[0]!, 0, body);
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
  });

  it.each([false, true])('rejects repeating pages even when next=%s', async (next) => {
    const http = new FakeHttpClient();
    const cfg = MULTPORN_CONFIGS[0]!;
    registerPage(http, cfg, 0, page(row('/comics/repeated'), true));
    registerPage(http, cfg, 1, page(row('/comics/repeated'), next));
    await expect(withAccount(() => importBookmarks(http))).rejects.toBeInstanceOf(ParseError);
  });

  it.each(MULTPORN_CONFIGS)('$id continues past pages of other content types', async (cfg) => {
    const http = new FakeHttpClient();
    registerPage(http, cfg, 0, page(row('/games/ignored'), true));
    registerPage(http, cfg, 1, page(row(`${cfg.pathPrefix}saved`)));
    const folders = await withAccount(() => importBookmarks(http, cfg));
    expect(folders[0]!.items).toEqual([expect.objectContaining({ url: `${cfg.pathPrefix}saved` })]);
    expect(http.requests).toHaveLength(2);
  });

  it('renews an expired personal session only when its password was saved', async () => {
    const http = new FakeHttpClient();
    registerLogin(http);
    let attempts = 0;
    http.register(
      (url) => new URL(url).pathname === '/bookmarks',
      () => ({ status: 200, body: attempts++ === 0 ? LOGIN_FORM : page(row('/comics/first')) }),
    );
    const onChange = vi.fn();
    const folders = await runWithSourceAccounts(
      {
        [SOURCE_AUTH_FAMILY.MULTPORN]: { jar: new CookieJar(), credentials: CREDENTIALS, onChange },
      },
      () => importBookmarks(http),
    );
    expect(folders[0]!.items).toHaveLength(1);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('submits the current Drupal build id and verifies the resulting session', async () => {
    const http = new FakeHttpClient();
    registerLogin(http);
    expect(await loginMultporn(http, DOMAIN, CREDENTIALS)).toBe(true);
    expect(Object.fromEntries(new URLSearchParams(http.requests[1]!.body))).toMatchObject({
      name: 'reader',
      pass: 'test-password',
      form_build_id: 'form-current-build',
      form_id: 'user_login',
    });
    const rejected = new FakeHttpClient();
    registerLogin(rejected, false);
    expect(await loginMultporn(rejected, DOMAIN, CREDENTIALS)).toBe(false);
  });

  it('keeps site outages distinct from invalid credentials', async () => {
    const http = new FakeHttpClient();
    http.register(() => true, { status: 503, body: 'Unavailable' });
    await expect(loginMultporn(http, DOMAIN, CREDENTIALS)).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
  });

  it('registers both catalogs under one optional account and supports password linking', async () => {
    const getHtml = vi
      .spyOn(HttpClientImpl.prototype, 'getHtml')
      .mockImplementation(async (url) => {
        const http = new FakeHttpClient();
        http.register(() => true, {
          status: 200,
          body: url.endsWith('/user/login') ? LOGIN_FORM : PROFILE,
        });
        return http.getHtml(url);
      });
    const postForm = vi
      .spyOn(HttpClientImpl.prototype, 'postForm')
      .mockImplementation(async (url) => {
        const http = new FakeHttpClient();
        http.register(() => true, { status: 200, body: PROFILE });
        return http.get(url);
      });
    const registry = createRegistry({
      credentials: {},
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    });
    try {
      for (const cfg of MULTPORN_CONFIGS) {
        expect(catalogEntryFor(cfg.id)).toMatchObject({
          authFamily: SOURCE_AUTH_FAMILY.MULTPORN,
          loginRequirement: SOURCE_LOGIN_REQUIREMENT.OPTIONAL,
        });
        expect(registry.get(cfg.id).info.isBookmarksImportSupported).toBe(true);
      }
      expect(await registry.loginAccount(SOURCE_AUTH_FAMILY.MULTPORN, CREDENTIALS)).toBeInstanceOf(
        CookieJar,
      );
    } finally {
      getHtml.mockRestore();
      postForm.mockRestore();
      await registry.close();
    }
  });
});

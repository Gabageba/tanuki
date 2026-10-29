import { CookieJar } from 'tough-cookie';
import { describe, expect, it, vi } from 'vitest';
import { BUILT_IN_BOOKMARK_FOLDER, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { fetchGroupleBookmarks } from '../src/sources/grouple/bookmarks';
import { GROUPLE_CONFIGS } from '../src/sources/grouple/config';
import { createGroupleParser } from '../src/sources/grouple/engine';
import { catalogEntryFor } from '../src/sources/catalog';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { generateUid } from '../src/core/uid';
import { ParseError, SourceAuthRequiredError } from '../src/errors';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const SETTINGS =
  '<script>var BOOKMARK_SETTINGS = {"custom1Enabled":true,"customName1":"На потом; ещё"};</script>';

describe.each(GROUPLE_CONFIGS)('$id bookmarks', (CFG) => {
  const DOMAIN = catalogEntryFor(CFG.id).domains[0];
  const AUTH_FAMILY = catalogEntryFor(CFG.id).authFamily!;
  const ITEM = {
    element: {
      elementId: { siteId: CFG.siteId, type: 'MANGA' },
      elementUrl: '/One-Piece',
      name: 'Ван-Пис',
      picUrl: '//images.example/cover.jpg',
    },
    resume: { url: `https://${DOMAIN}/One-Piece/vol3/12.5?mature=1` },
  };

  const setup = async () => {
    const http = new FakeHttpClient();
    const jar = new CookieJar();
    await jar.setCookie('gwt=user-token; Path=/; Secure', `https://${DOMAIN}/`);
    const ctx: ParserContext = {
      http,
      jar: new CookieJar(),
      domain: DOMAIN,
      credentials: {},
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    };
    const run = () =>
      runWithSourceAccounts({ [AUTH_FAMILY]: { jar } }, () =>
        createGroupleParser(CFG, ctx).getBookmarks!(),
      );
    return { http, jar, ctx, run };
  };

  it('imports folders, filters other sites and reviews, preserves title IDs and fractional progress across pages', async () => {
    const { http, run, jar } = await setup();
    http.register((url) => url.endsWith('/private/bookmarks'), { status: 200, body: SETTINGS });
    http.register(
      (url, body) =>
        url.endsWith('/api/bookmark/list') && JSON.parse(body!).statusFilter[0] === 'WATCHING',
      () => {
        const request = JSON.parse(http.requests.at(-1)!.body!);
        const list =
          request.offset === 0
            ? Array.from({ length: 50 }, (_, i) => ({
                ...ITEM,
                element: { ...ITEM.element, elementUrl: `/title-${i}` },
              }))
            : [
                ITEM,
                {
                  ...ITEM,
                  element: { ...ITEM.element, elementId: { siteId: CFG.siteId === 1 ? 2 : 1 } },
                },
                {
                  ...ITEM,
                  element: { ...ITEM.element, elementId: { siteId: CFG.siteId, type: 'REVIEW' } },
                },
              ];
        return { status: 200, body: JSON.stringify({ list, total: 53 }) };
      },
    );
    http.register((url) => url.endsWith('/api/bookmark/list'), {
      status: 200,
      body: JSON.stringify({ list: [], total: 0 }),
    });
    const folders = await run();
    expect(folders).toHaveLength(8);
    const reading = folders.find((folder) => folder.builtIn === BUILT_IN_BOOKMARK_FOLDER.READING)!;
    expect(reading.items).toHaveLength(51);
    expect(reading.items.at(-1)).toMatchObject({
      id: generateUid(CFG.id, '/One-Piece'),
      url: '/One-Piece',
      title: 'Ван-Пис',
      coverUrl: 'https://images.example/cover.jpg',
      lastChapterNumber: 12.5,
      lastChapterVolume: 3,
    });
    expect(folders.find((folder) => folder.id === 'USER_DEFINED')).toMatchObject({
      builtIn: null,
      name: 'На потом; ещё',
    });
    expect(folders.find((folder) => folder.id === 'PLANED')?.builtIn).toBe(
      BUILT_IN_BOOKMARK_FOLDER.PLANNED,
    );
    expect(folders.find((folder) => folder.id === 'COMPLETED')?.builtIn).toBe(
      BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
    );
    expect(folders.find((folder) => folder.id === 'DROPPED')?.builtIn).toBe(
      BUILT_IN_BOOKMARK_FOLDER.DROPPED,
    );
    expect(folders.find((folder) => folder.id === 'ON_HOLD')?.builtIn).toBe(
      BUILT_IN_BOOKMARK_FOLDER.ON_HOLD,
    );
    expect(folders.find((folder) => folder.id === 'FAVORITE')?.builtIn).toBe(
      BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
    );
    expect(
      http.requests
        .filter((req) => req.body)
        .every(
          (req) =>
            req.headers.Authorization === 'Bearer user-token' &&
            JSON.parse(req.body!).siteFilter[0] === CFG.siteId,
        ),
    ).toBe(true);
    expect(http.requests.every((req) => new URL(req.url).host === CFG.authGateway)).toBe(true);
    expect(
      (await jar.getCookies(`https://${CFG.authGateway}/`)).find((cookie) => cookie.key === 'gwt')
        ?.value,
    ).toBe('user-token');
  });

  it('does not fall back to the service account', async () => {
    const { http, ctx } = await setup();
    await expect(fetchGroupleBookmarks(CFG, ctx, vi.fn())).rejects.toBeInstanceOf(
      SourceAuthRequiredError,
    );
    expect(http.requests).toEqual([]);
  });

  it('does not use an account from the other authentication family', async () => {
    const { http, jar, ctx } = await setup();
    const OTHER_FAMILY =
      AUTH_FAMILY === SOURCE_AUTH_FAMILY.GROUPLE
        ? SOURCE_AUTH_FAMILY.ALLHENTAI
        : SOURCE_AUTH_FAMILY.GROUPLE;
    await expect(
      runWithSourceAccounts({ [OTHER_FAMILY]: { jar } }, () =>
        createGroupleParser(CFG, ctx).getBookmarks!(),
      ),
    ).rejects.toBeInstanceOf(SourceAuthRequiredError);
    expect(http.requests).toEqual([]);
  });

  it('returns empty folders for an empty library', async () => {
    const { http, run } = await setup();
    http.register((url) => url.endsWith('/private/bookmarks'), { status: 200, body: SETTINGS });
    http.register((url) => url.endsWith('/api/bookmark/list'), {
      status: 200,
      body: '{"list":[],"total":0}',
    });
    expect((await run()).every((folder) => folder.items.length === 0)).toBe(true);
  });

  it('keeps missing progress unknown and normalizes mirror URLs', async () => {
    const { http, run } = await setup();
    http.register((url) => url.endsWith('/private/bookmarks'), { status: 200, body: SETTINGS });
    http.register((url) => url.endsWith('/api/bookmark/list'), {
      status: 200,
      body: JSON.stringify({
        list: [
          {
            ...ITEM,
            resume: null,
            element: { ...ITEM.element, elementUrl: `https://old.${DOMAIN}/One-Piece?x=1` },
          },
        ],
        total: 1,
      }),
    });
    expect((await run())[0]!.items[0]).toMatchObject({
      url: '/One-Piece',
      id: generateUid(CFG.id, '/One-Piece'),
      lastChapterNumber: null,
      lastChapterVolume: null,
    });
  });

  it('rejects expired sessions without returning an empty library', async () => {
    const { http, run } = await setup();
    http.register((url) => url.endsWith('/private/bookmarks'), {
      status: 200,
      body: '<form>Login</form>',
    });
    await expect(run()).rejects.toBeInstanceOf(SourceAuthRequiredError);
  });

  it('rejects REST authentication failures', async () => {
    const { http, run } = await setup();
    http.register((url) => url.endsWith('/private/bookmarks'), { status: 200, body: SETTINGS });
    http.register((url) => url.endsWith('/api/bookmark/list'), { status: 401, body: '{}' });
    await expect(run()).rejects.toBeInstanceOf(SourceAuthRequiredError);
  });

  it('renews a rejected REST token with saved credentials', async () => {
    const { http, jar, ctx } = await setup();
    let attempts = 0;
    http.register((url) => url.endsWith('/private/bookmarks'), { status: 200, body: SETTINGS });
    http.register(
      (url) => url.endsWith('/api/bookmark/list'),
      () => {
        attempts++;
        return attempts === 1
          ? { status: 401, body: '{}' }
          : { status: 200, body: '{"list":[],"total":0}' };
      },
    );
    const login = vi.fn(async () => {
      await jar.setCookie('gwt=renewed-token; Path=/; Secure', `https://${DOMAIN}/`);
      return true;
    });
    await runWithSourceAccounts(
      {
        [AUTH_FAMILY]: {
          jar,
          credentials: { username: 'reader', password: 'password' },
        },
      },
      () => fetchGroupleBookmarks(CFG, ctx, login),
    );
    expect(login).toHaveBeenCalledOnce();
    expect(http.requests.at(-1)?.headers.Authorization).toBe('Bearer renewed-token');
  });

  it('rejects a partial API result', async () => {
    const { http, run } = await setup();
    http.register((url) => url.endsWith('/private/bookmarks'), { status: 200, body: SETTINGS });
    http.register((url) => url.endsWith('/api/bookmark/list'), {
      status: 200,
      body: '{"list":[],"total":2}',
    });
    await expect(run()).rejects.toBeInstanceOf(ParseError);
  });
});

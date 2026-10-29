import { CookieJar } from 'tough-cookie';
import { describe, expect, it, vi } from 'vitest';
import { BUILT_IN_BOOKMARK_FOLDER, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { fetchGroupleBookmarks } from '../src/sources/grouple/bookmarks';
import { GROUPLE_CONFIGS } from '../src/sources/grouple/config';
import { createGroupleParser } from '../src/sources/grouple/engine';
import { SOURCE_ID } from '../src/sources/catalog';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { generateUid } from '../src/core/uid';
import { ParseError, SourceAuthRequiredError } from '../src/errors';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const CFG = GROUPLE_CONFIGS.find((cfg) => cfg.id === SOURCE_ID.MINTMANGA)!;
const DOMAIN = 'mintmanga.example';
const SETTINGS =
  '<script>var BOOKMARK_SETTINGS = {"custom1Enabled":true,"customName1":"На потом; ещё"};</script>';
const ITEM = {
  element: {
    elementId: { siteId: 2, type: 'MANGA' },
    elementUrl: '/One-Piece',
    name: 'Ван-Пис',
    picUrl: '//images.example/cover.jpg',
  },
  resume: { url: 'https://mintmanga.example/One-Piece/vol3/12.5?mature=1' },
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
  const run = (login = vi.fn(async () => true)) =>
    runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.GROUPLE]: { jar } }, () =>
      fetchGroupleBookmarks(CFG, ctx, login),
    );
  return { http, jar, ctx, run };
};

describe('MintManga bookmarks', () => {
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
                { ...ITEM, element: { ...ITEM.element, elementId: { siteId: 1 } } },
                { ...ITEM, element: { ...ITEM.element, elementId: { siteId: 2, type: 'REVIEW' } } },
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
    expect(
      http.requests
        .filter((req) => req.body)
        .every(
          (req) =>
            req.headers.Authorization === 'Bearer user-token' &&
            JSON.parse(req.body!).siteFilter[0] === 2,
        ),
    ).toBe(true);
    expect(
      (await jar.getCookies('https://3.grouple.co/')).find((cookie) => cookie.key === 'gwt')?.value,
    ).toBe('user-token');
  });

  it('does not fall back to the service account', async () => {
    const { http, ctx } = await setup();
    await expect(fetchGroupleBookmarks(CFG, ctx, vi.fn())).rejects.toBeInstanceOf(
      SourceAuthRequiredError,
    );
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
            element: { ...ITEM.element, elementUrl: 'https://old.mintmanga.example/One-Piece?x=1' },
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
        [SOURCE_AUTH_FAMILY.GROUPLE]: {
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

  it('exposes import only for the verified source', async () => {
    const { ctx } = await setup();
    expect(createGroupleParser(CFG, ctx).getBookmarks).toBeTypeOf('function');
    expect(
      createGroupleParser(
        GROUPLE_CONFIGS.find((cfg) => cfg.id === SOURCE_ID.READMANGA_RU)!,
        ctx,
      ).getBookmarks,
    ).toBeUndefined();
  });
});

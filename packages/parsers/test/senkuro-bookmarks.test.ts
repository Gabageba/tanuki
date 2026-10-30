import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { BUILT_IN_BOOKMARK_FOLDER, SOURCE_AUTH_FAMILY, catalogEntryFor } from '@tanuki/contracts';
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
import {
  createSenkuroSessionJar,
  fetchSenkuroViewer,
  getSenkuroSessionToken,
  parseSenkuroSessionValue,
} from '../src/sources/senkuro/auth';
import { SENKURO_CONFIGS, type SenkuroConfig } from '../src/sources/senkuro/config';
import { createSenkuroParser } from '../src/sources/senkuro/engine';
import { FakeHttpClient } from './support/fake-http';

const TOKEN = 'test-senkuro-account-session-token';
const DOMAIN = 'senkuro.example';
const CONFIG = SENKURO_CONFIGS.find(({ id }) => id === SOURCE_ID.SENKURO)!;
const COLLECTION = {
  id: 'reading',
  name: 'Читаю',
  entityType: 'MANGA',
  status: 'WATCHING',
  system: true,
};
const VIEWER = { user: { id: 'user-42', name: 'Читатель' }, userBookmarkCollections: [COLLECTION] };
const MANGA = {
  __typename: 'Manga',
  id: 'manga-1',
  slug: 'one-piece',
  applicationId: CONFIG.appId,
  titles: [{ lang: 'RU', content: 'Ван-Пис' }],
  type: 'MANGA',
  rating: 'GENERAL',
  cover: { original: { url: 'https://cdn.example/cover.jpg' } },
};
const makeContext = (http: FakeHttpClient): ParserContext => ({
  http,
  domain: DOMAIN,
  jar: new CookieJar(),
  credentials: {},
  logger: { info: () => {}, warn: () => {}, error: () => {} },
});
const register = (http: FakeHttpClient, query: string, data: unknown, status = 200) =>
  http.register((_url, body) => body?.includes(query) ?? false, {
    status,
    body: JSON.stringify(data),
    contentType: 'application/json',
  });
const withAccount = async <T>(fn: () => Promise<T>, cfg = CONFIG) =>
  runWithSourceAccounts(
    {
      [catalogEntryFor(cfg.id).authFamily!]: { jar: await createSenkuroSessionJar(TOKEN) },
    },
    fn,
  );
const page = (nodes: unknown[], hasNextPage = false, endCursor: string | null = null) => ({
  data: {
    userBookmarks: { edges: nodes.map((node) => ({ node })), pageInfo: { hasNextPage, endCursor } },
  },
});

describe('Senkuro and Senkognito bookmarks', () => {
  it('uses one stored family session for both source domains', async () => {
    const http = new FakeHttpClient();
    register(http, 'ImportViewer', { data: { viewer: VIEWER } });
    register(http, 'ImportBookmarks', page([]));
    const jar = CookieJar.deserializeSync(await (await createSenkuroSessionJar(TOKEN)).serialize());
    await runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.SENKURO]: { jar } }, async () => {
      for (const cfg of SENKURO_CONFIGS) {
        expect(catalogEntryFor(cfg.id).authFamily).toBe(SOURCE_AUTH_FAMILY.SENKURO);
        const ctx = { ...makeContext(http), domain: catalogEntryFor(cfg.id).domains[0] };
        await expect(createSenkuroParser(cfg, ctx).getBookmarks!()).resolves.toHaveLength(1);
      }
    });
    expect(http.requests.map(({ headers }) => headers.Authorization)).toEqual(
      Array(4).fill(`Bearer ${TOKEN}`),
    );
    expect(http.requests.map(({ headers }) => headers['app-id'])).toEqual(
      SENKURO_CONFIGS.flatMap(({ appId }) => [appId, appId]),
    );
  });

  it.each(SENKURO_CONFIGS)(
    '$id imports every page and only its own catalog',
    async (cfg: SenkuroConfig) => {
      const http = new FakeHttpClient();
      register(http, 'ImportViewer', {
        data: {
          viewer: {
            ...VIEWER,
            userBookmarkCollections: [
              COLLECTION,
              {
                ...COLLECTION,
                id: 'custom',
                name: 'Своя',
                system: false,
                preference: { name: 'На выходные' },
              },
              { ...COLLECTION, id: 'anime', entityType: 'ANIME' },
            ],
          },
        },
      });
      let count = 0;
      http.register(
        (_url, body) => body?.includes('ImportBookmarks') ?? false,
        () => ({
          status: 200,
          body: JSON.stringify(
            count++ === 0
              ? page(
                  [
                    {
                      collectionId: 'reading',
                      number: '12.5',
                      entity: { ...MANGA, applicationId: cfg.appId },
                    },
                    {
                      collectionId: 'reading',
                      number: 10,
                      entity: { ...MANGA, applicationId: 'other-app' },
                    },
                    { collectionId: 'reading', number: null, entity: null },
                  ],
                  true,
                  'cursor-2',
                )
              : page([
                  {
                    collectionId: 'custom',
                    number: null,
                    entity: { ...MANGA, applicationId: cfg.appId, cover: null },
                  },
                ]),
          ),
        }),
      );
      const folders = await withAccount(
        () => createSenkuroParser(cfg, makeContext(http)).getBookmarks!(),
        cfg,
      );
      expect(
        folders.map(({ id, name, builtIn, items }) => ({ id, name, builtIn, count: items.length })),
      ).toEqual([
        { id: 'reading', name: 'Читаю', builtIn: BUILT_IN_BOOKMARK_FOLDER.READING, count: 1 },
        { id: 'custom', name: 'На выходные', builtIn: null, count: 1 },
      ]);
      expect(folders[0]!.items[0]).toMatchObject({
        id: generateUid(cfg.id, MANGA.id),
        url: 'manga-1,,one-piece',
        title: 'Ван-Пис',
        coverUrl: MANGA.cover.original.url,
        lastChapterNumber: 12.5,
        lastChapterVolume: null,
      });
      expect(folders[1]!.items[0]).toMatchObject({ coverUrl: null, lastChapterNumber: null });
      expect(
        http.requests.every(
          ({ url, headers }) =>
            url === cfg.apiEndpoint &&
            headers.Authorization === `Bearer ${TOKEN}` &&
            headers['app-id'] === cfg.appId,
        ),
      ).toBe(true);
      expect(JSON.parse(http.requests[2]!.body!).variables).toEqual({
        userId: VIEWER.user.id,
        after: 'cursor-2',
      });
    },
  );

  it('maps system statuses and keeps rereading and custom folders', async () => {
    const http = new FakeHttpClient();
    const statuses = [
      'WATCHING',
      'PLANNING',
      'COMPLETED',
      'FAVORITED',
      'PAUSED',
      'DROPPED',
      'REWATCHING',
    ];
    register(http, 'ImportViewer', {
      data: {
        viewer: {
          ...VIEWER,
          userBookmarkCollections: statuses.map((status) => ({
            ...COLLECTION,
            id: status,
            status,
          })),
        },
      },
    });
    register(http, 'ImportBookmarks', page([]));
    const folders = await withAccount(() =>
      createSenkuroParser(CONFIG, makeContext(http)).getBookmarks!(),
    );
    expect(folders.map(({ builtIn }) => builtIn)).toEqual([
      BUILT_IN_BOOKMARK_FOLDER.READING,
      BUILT_IN_BOOKMARK_FOLDER.PLANNED,
      BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
      BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
      BUILT_IN_BOOKMARK_FOLDER.ON_HOLD,
      BUILT_IN_BOOKMARK_FOLDER.DROPPED,
      null,
    ]);
  });

  it('requires the caller’s Senkuro family session', async () => {
    const http = new FakeHttpClient();
    const parser = createSenkuroParser(CONFIG, makeContext(http));
    await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
    await runWithSourceAccounts(
      { [SOURCE_AUTH_FAMILY.REMANGA]: { jar: new CookieJar() } },
      async () => {
        await expect(parser.getBookmarks!()).rejects.toBeInstanceOf(SourceAuthRequiredError);
      },
    );
    expect(http.requests).toEqual([]);
  });

  it.each([
    { status: 200, body: { data: { viewer: { ...VIEWER, user: null } } } },
    { status: 401, body: {} },
    { status: 200, body: { errors: [{ extensions: { code: 'NOT_AUTHORIZED' } }], data: null } },
  ])(
    'reports a rejected session rather than an empty library: $status',
    async ({ status, body }) => {
      const http = new FakeHttpClient();
      register(http, 'ImportViewer', body, status);
      await expect(
        withAccount(() => createSenkuroParser(CONFIG, makeContext(http)).getBookmarks!()),
      ).rejects.toBeInstanceOf(SourceTokenExpiredError);
    },
  );

  it.each([
    { body: {}, status: 200, error: ParseError },
    { body: page([], true, 'next'), status: 200, error: ParseError },
    {
      body: page([{ collectionId: 'missing', number: 1, entity: MANGA }]),
      status: 200,
      error: ParseError,
    },
    { body: {}, status: 503, error: SourceUnavailableError },
  ])('rejects malformed or unavailable pages', async ({ body, status, error }) => {
    const http = new FakeHttpClient();
    register(http, 'ImportViewer', { data: { viewer: VIEWER } });
    register(http, 'ImportBookmarks', body, status);
    await expect(
      withAccount(() => createSenkuroParser(CONFIG, makeContext(http)).getBookmarks!()),
    ).rejects.toBeInstanceOf(error);
  });

  it('rejects repeated cursors instead of looping or returning a partial library', async () => {
    const http = new FakeHttpClient();
    register(http, 'ImportViewer', { data: { viewer: VIEWER } });
    register(
      http,
      'ImportBookmarks',
      page([{ collectionId: 'reading', number: 1, entity: MANGA }], true, 'same'),
    );
    await expect(
      withAccount(() => createSenkuroParser(CONFIG, makeContext(http)).getBookmarks!()),
    ).rejects.toBeInstanceOf(ParseError);
    expect(http.requests).toHaveLength(3);
  });

  it('advertises both sources through the registry', async () => {
    const registry = createRegistry({
      credentials: {},
      logger: makeContext(new FakeHttpClient()).logger,
    });
    try {
      for (const cfg of SENKURO_CONFIGS)
        expect(registry.get(cfg.id).info.isBookmarksImportSupported).toBe(true);
    } finally {
      await registry.close();
    }
  });
});

describe('Senkuro session transfer', () => {
  it('accepts raw and URL-encoded tokens and cookie headers, and survives storage', async () => {
    expect(parseSenkuroSessionValue(TOKEN)).toBe(TOKEN);
    expect(parseSenkuroSessionValue(`access_token=${TOKEN}`)).toBe(TOKEN);
    expect(
      parseSenkuroSessionValue(`a=1; access_token=${encodeURIComponent(TOKEN + '=')}; b=2`),
    ).toBe(TOKEN + '=');
    const jar = await createSenkuroSessionJar(TOKEN);
    expect(await getSenkuroSessionToken(CookieJar.deserializeSync(await jar.serialize()))).toBe(
      TOKEN,
    );
  });
  it.each(['', 'short', 'other=cookie', '%invalid', 'bad\r\nAuthorization: value'])(
    'rejects invalid input: %s',
    (value) => {
      expect(parseSenkuroSessionValue(value)).toBeNull();
    },
  );
  it('rejects a malformed viewer', async () => {
    const http = new FakeHttpClient();
    register(http, 'ImportViewer', { data: { viewer: {} } });
    await expect(fetchSenkuroViewer(http, CONFIG, DOMAIN, TOKEN)).rejects.toBeInstanceOf(
      ParseError,
    );
  });
});

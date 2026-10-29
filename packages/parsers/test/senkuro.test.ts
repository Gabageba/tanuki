import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  FILTER_TYPE,
  TITLE_STATE,
  TITLE_TYPE,
  RANGE_FORMAT,
  SOURCE_CONTENT_TYPE,
} from '@tanuki/contracts';
import { createSenkuroParser, SENKURO_FILTER_GROUP } from '../src/sources/senkuro/engine';
import { SENKURO_CONFIGS } from '../src/sources/senkuro/config';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { checkHome } from './support/home';

const DOMAIN = 'senkuro.com';

const SEARCH_RESPONSE = JSON.stringify({
  data: {
    mangas: {
      edges: [
        {
          node: {
            id: '123',
            slug: 'one-piece',
            titles: [
              { lang: 'EN', content: 'One Piece' },
              { lang: 'RU', content: 'Ван-Пис' },
            ],
            cover: { original: { url: 'https://cdn.senkuro.com/one-piece.jpg' } },
            type: 'MANGA',
            releasedOn: '1997-07-22',
            chapters: 1000,
            score: 8.04,
            status: 'ONGOING',
            labels: [{ slug: 'adventure', titles: [{ lang: 'RU', content: 'приключения' }] }],
            localizations: [
              {
                lang: 'RU',
                description: [
                  {
                    content: [
                      { text: 'Первый абзац.' },
                      { type: 'hardBreak' },
                      { text: 'Продолжение.' },
                    ],
                  },
                  { content: [{ text: 'ᅠ' }] },
                  { content: [{ text: 'Второй абзац.' }] },
                ],
              },
            ],
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
});

const DETAILS_RESPONSE = JSON.stringify({
  data: {
    manga: {
      id: '123',
      slug: 'one-piece',
      titles: [{ lang: 'RU', content: 'Ван-Пис' }],
      alternativeNames: [{ lang: 'EN', content: 'One Piece' }],
      localizations: [{ lang: 'RU', description: [{ content: [{ text: 'Описание тайтла.' }] }] }],
      type: 'MANGA',
      rating: 'GENERAL',
      score: 9.16,
      status: 'ONGOING',
      formats: ['WEB', 'IN_COLOR'],
      labels: [{ slug: 'adventure', titles: [{ lang: 'RU', content: 'приключения' }] }],
      cover: { original: { url: 'https://cdn.senkuro.com/one-piece.jpg' } },
      mainStaff: [{ roles: ['STORY_AND_ART'], person: { name: 'Oda Eiichiro' } }],
      releasedOn: '1997-07-22',
      views: 123456,
      originCountry: 'JP',
      translitionStatus: 'IN_PROGRESS',
      createdAt: '2020-01-01T00:00:00.000Z',
      publishers: [{ name: 'Shueisha' }],
      scoreDistributions: [{ count: 700 }, { count: 259 }],
    },
  },
});

const CHAPTERS_RESPONSE = JSON.stringify({
  data: {
    mangaTachiyomiChapters: {
      chapters: [
        {
          id: 'c2',
          slug: 'ch-2',
          number: '2',
          volume: '1',
          teamIds: ['t1'],
          createdAt: '2024-01-02T10:00:00.000Z',
        },
        {
          id: 'c1',
          slug: 'ch-1',
          number: '1',
          volume: '1',
          teamIds: ['t1'],
          createdAt: '2024-01-01T09:30:00.000Z',
        },
      ],
      teams: [{ id: 't1', name: 'TeamA' }],
    },
  },
});

const PAGES_RESPONSE = JSON.stringify({
  data: {
    mangaTachiyomiChapterPages: {
      pages: [
        { url: 'https://cdn.senkuro.com/001.jpg' },
        { url: 'https://cdn.senkuro.com/002.jpg' },
      ],
    },
  },
});

const ALL_LABELS_RESPONSE = JSON.stringify({
  data: {
    allLabels: [
      {
        id: 'root-themes',
        slug: 'themes',
        rootId: 'root-themes',
        depth: 0,
        rating: 'GENERAL',
        titles: [{ lang: 'RU', content: 'Темы' }],
      },
      {
        id: 'isekai',
        slug: 'isekai',
        rootId: 'root-themes',
        depth: 1,
        rating: 'GENERAL',
        titles: [{ lang: 'RU', content: 'Исекай' }],
      },
      {
        id: 'root-hentai',
        slug: 'hentai_themes',
        rootId: 'root-hentai',
        depth: 0,
        rating: 'EXPLICIT',
        titles: [{ lang: 'RU', content: 'Хентайные Темы' }],
      },
      {
        id: 'ecchi',
        slug: 'ecchi',
        rootId: 'root-hentai',
        depth: 1,
        rating: 'EXPLICIT',
        titles: [{ lang: 'RU', content: 'Этти' }],
      },
    ],
  },
});

const SENKURO_CONFIG = SENKURO_CONFIGS.find((c) => c.id === SOURCE_ID.SENKURO)!;
const SENKOGNITO_CONFIG = SENKURO_CONFIGS.find((c) => c.id === SOURCE_ID.SENKOGNITO)!;

const makeContext = (http: FakeHttpClient, domain = DOMAIN): ParserContext => {
  return {
    http,
    domain,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
};

// `http` is a parameter so a caller can register its own rule (e.g. a request spy) ahead of
// these — FakeHttpClient matches in registration order and stops at the first hit.
const setUpFixtures = (
  endpoint = SENKURO_CONFIG.apiEndpoint,
  http = new FakeHttpClient(),
): FakeHttpClient => {
  http.register((url, body) => url === endpoint && !!body?.includes('mangaTachiyomiChapterPages'), {
    status: 200,
    body: PAGES_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('mangaTachiyomiChapters('), {
    status: 200,
    body: CHAPTERS_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('fetchManga('), {
    status: 200,
    body: DETAILS_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('fetchMangas'), {
    status: 200,
    body: SEARCH_RESPONSE,
    contentType: 'application/json',
  });
  http.register((url, body) => url === endpoint && !!body?.includes('allLabels'), {
    status: 200,
    body: ALL_LABELS_RESPONSE,
    contentType: 'application/json',
  });
  return http;
};

describe('Senkuro parser conformance', () => {
  const http = setUpFixtures();
  const parser = createSenkuroParser(SENKURO_CONFIG, makeContext(http));

  it('getList: chapters null, score parsed, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.SENKURO);
    expect(item!.rating).toBeCloseTo(0.804);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    // RU title preferred over EN
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
    expect(item!.year).toBe(1997);
    expect(item!.chaptersCount).toBe(1000);
    expect(item!.releaseState).toBe(TITLE_STATE.ONGOING);
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(item!.description).toBe('Первый абзац.\nПродолжение.\n\nВторой абзац.');
    expect(http.requests[0]!.headers['app-id']).toBe(SENKURO_CONFIG.appId);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('123,,one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      expect(chapter.scanlator).toBe('TeamA');
      // Команда перевода у Senkuro и есть ветка — у тайтла с двумя командами получится два
      // независимых списка глав, а не один перемешанный.
      expect(chapter.branch).toBe('TeamA');
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering
    expect(manga.chapters![0]!.number).toBe(1);
    expect(manga.chapters![1]!.number).toBe(2);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.description).not.toContain('Альтернативные названия');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.authors).toEqual(['Oda Eiichiro']);
    expect(manga.artists).toEqual(['Oda Eiichiro']);
    expect(manga.translators).toEqual(['TeamA']);
    expect(manga.publishers).toEqual(['Shueisha']);
    expect(manga.releaseFormats).toEqual(['Веб', 'В цвете']);
    expect(manga.type).toBe(TITLE_TYPE.MANGA);
    expect(manga.rating).toBeCloseTo(0.916);
    expect(manga.year).toBe(1997);
    expect(manga.views).toBe(123456);
    expect(manga.votesCount).toBe(959);
    expect(manga.country).toBe('Япония');
    expect(manga.translationState).toBe(TITLE_STATE.ONGOING);
    expect(manga.releaseDate).toBeGreaterThan(0);
    expect(manga.addedAt).toBeGreaterThan(0);
  });

  it('getList: score of exactly 0 (no votes yet) falls back to RATING_UNKNOWN', async () => {
    const zeroScoreResponse = JSON.stringify({
      data: {
        mangas: {
          edges: [{ node: { id: '999', slug: 'unrated', titles: [], score: 0 } }],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });
    const zeroScoreHttp = new FakeHttpClient();
    zeroScoreHttp.register(
      (url, body) => url === SENKURO_CONFIG.apiEndpoint && !!body?.includes('fetchMangas'),
      { status: 200, body: zeroScoreResponse, contentType: 'application/json' },
    );
    const zeroScoreParser = createSenkuroParser(SENKURO_CONFIG, makeContext(zeroScoreHttp));
    const items = await zeroScoreParser.getList({ offset: 0, limit: 20 });
    expect(items[0]!.rating).toBe(-1);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('123,,one-piece');
    const chapter1 = manga.chapters!.find((c) => c.number === 1)!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://cdn.senkuro.com/001.jpg');
  });

  it('getFilters: one group per allLabels root, plus the static and range groups', async () => {
    const groups = await parser.getFilters!();

    // SENKURO isn't the 18+ catalog, so the EXPLICIT-rated root is hidden entirely.
    expect(groups.find((g) => g.id === 'label-hentai_themes')).toBeUndefined();

    const themesGroup = groups.find((g) => g.id === 'label-themes')!;
    expect(themesGroup.title).toBe('Темы');
    expect(themesGroup.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(themesGroup.options).toEqual([{ key: 'isekai', title: 'Исекай', count: null }]);

    const typeGroup = groups.find((g) => g.id === SENKURO_FILTER_GROUP.TYPE)!;
    expect(typeGroup.type).toBe(FILTER_TYPE.CHECKBOX_EXCLUDE);
    expect(typeGroup.options.map((o) => o.key)).toContain('MANHWA');

    const chaptersGroup = groups.find((g) => g.id === SENKURO_FILTER_GROUP.CHAPTERS)!;
    expect(chaptersGroup.type).toBe(FILTER_TYPE.RANGE);
    expect(chaptersGroup.settings?.range).toEqual({ min: 0, max: 2000 });

    const releasedOnGroup = groups.find((g) => g.id === SENKURO_FILTER_GROUP.RELEASED_ON)!;
    expect(releasedOnGroup.settings?.range.format).toBe(RANGE_FORMAT.YEAR);
  });

  it('getList with filters: label/type/chapters selections reach the mangas() variables', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'label-themes', key: 'isekai' },
        { groupId: 'label-hentai_themes', key: 'ecchi', exclude: true },
        { groupId: SENKURO_FILTER_GROUP.TYPE, key: 'MANHWA' },
        { groupId: SENKURO_FILTER_GROUP.CHAPTERS, range: { min: 10, max: 100 } },
        { groupId: SENKURO_FILTER_GROUP.RELEASED_ON, range: { min: 2015 } },
      ],
    });

    const mangasRequests = http.requests.filter((r) => r.body?.includes('fetchMangas'));
    const request = mangasRequests[mangasRequests.length - 1]!;
    const variables = (JSON.parse(request.body!) as { variables: Record<string, unknown> })
      .variables;
    expect(variables['label']).toEqual({ include: ['isekai'], exclude: ['ecchi'] });
    expect(variables['type']).toEqual({ include: ['MANHWA'], exclude: [] });
    expect(variables['chapters']).toEqual({ start: 10, end: 100 });
    expect(variables['releasedOn']).toEqual({ start: '2015-01-01', end: undefined });
  });
});

// SENKOGNITO is the same engine over the same backend, so the only behaviour worth asserting
// separately is the part the config actually changes: which host is called, which catalog the
// app-id header selects, and which source the results are attributed to.
describe('Senkognito config', () => {
  it('lists its own catalog from its own API host', async () => {
    const http = setUpFixtures(SENKOGNITO_CONFIG.apiEndpoint);
    const parser = createSenkuroParser(SENKOGNITO_CONFIG, makeContext(http, 'ne.senkognito.com'));

    const items = await parser.getList({ offset: 0, limit: 20 });

    // Sending Senkuro's app-id (or none at all) would silently serve Senkuro's catalog.
    expect(http.requests).toHaveLength(1);
    expect(http.requests[0]!.url).toBe(SENKOGNITO_CONFIG.apiEndpoint);
    expect(http.requests[0]!.headers['app-id']).toBe(SENKOGNITO_CONFIG.appId);
    expect(SENKOGNITO_CONFIG.appId).not.toBe(SENKURO_CONFIG.appId);
    expect(items[0]!.source).toBe(SOURCE_ID.SENKOGNITO);
    expect(items[0]!.publicUrl).toBe('https://ne.senkognito.com/manga/one-piece');
    // Different source id ⇒ a different uid for the same upstream manga, so the two storefronts
    // never collide in the app's catalog.
    const senkuroItems = await createSenkuroParser(
      SENKURO_CONFIG,
      makeContext(setUpFixtures()),
    ).getList({ offset: 0, limit: 20 });
    expect(items[0]!.id).not.toBe(senkuroItems[0]!.id);
  });

  it('exposes the catalog entry as a hentai source', () => {
    const parser = createSenkuroParser(SENKOGNITO_CONFIG, makeContext(new FakeHttpClient()));
    expect(parser.info.title).toBe('Senkognito');
    expect(parser.info.contentType).toBe(SOURCE_CONTENT_TYPE.HENTAI);
  });
});

describe('Senkuro getHome', () => {
  const card = (n: number) => ({
    id: `TUFOR0E6${n}`,
    slug: `manga-${n}`,
    titles: [{ lang: 'RU', content: `Тайтл ${n}` }],
    cover: { original: { url: `https://mirai.senkuro.net/manga/${n}/cover.jpg` } },
    type: 'MANHWA',
    chapters: 10,
    rating: 'GENERAL',
    score: 8.1,
    status: 'ONGOING',
  });
  const registerHome = (http: FakeHttpClient) => {
    http.register((_url, body) => body?.includes('fetchPopularMangaByPeriod') ?? false, {
      status: 200,
      body: JSON.stringify({ data: { mangaPopularByPeriod: [card(1), card(2)] } }),
      contentType: 'application/json',
    });
    http.register((_url, body) => body?.includes('fetchMangas') ?? false, {
      status: 200,
      body: JSON.stringify({
        data: { mangas: { edges: [{ node: card(3) }], pageInfo: { hasNextPage: false } } },
      }),
      contentType: 'application/json',
    });
  };
  const requestVariables = (http: FakeHttpClient) =>
    http.requests.map(({ body }) => JSON.parse(body!).variables as Record<string, unknown>);

  it('keeps a title without a source cover without treating the whole section as broken', async () => {
    const http = new FakeHttpClient();
    http.register((_url, body) => body?.includes('fetchMangas') ?? false, {
      status: 200,
      body: JSON.stringify({
        data: {
          mangas: {
            edges: [{ node: { ...card(3), cover: null } }, { node: card(4) }],
            pageInfo: { hasNextPage: false },
          },
        },
      }),
    });
    registerHome(http);
    const parser = createSenkuroParser(SENKURO_CONFIG, makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);
    const newest = sections.find(({ id }) => id === 'newest')!;
    expect(newest.items).toHaveLength(2);
    expect(newest.items[0]!.coverUrl).toBeNull();
    expect(newest.items[1]!.coverUrl).toBe(card(4).cover.original.url);
  });

  it('still reports a section that lost every cover', async () => {
    const http = new FakeHttpClient();
    http.register((_url, body) => body?.includes('fetchMangas') ?? false, {
      status: 200,
      body: JSON.stringify({
        data: {
          mangas: {
            edges: [{ node: { ...card(3), cover: null } }],
            pageInfo: { hasNextPage: false },
          },
        },
      }),
    });
    registerHome(http);

    const { problems } = await checkHome(createSenkuroParser(SENKURO_CONFIG, makeContext(http)));

    expect(problems).toContain('newest: no covers');
  });

  it('Senkuro: «Самое читаемое» by period, the rest — from the catalog', async () => {
    const http = new FakeHttpClient();
    registerHome(http);
    const parser = createSenkuroParser(SENKURO_CONFIG, makeContext(http));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);
    expect(sections.map(({ items }) => items.length)).toEqual([2, 1, 1, 1, 1, 1, 1]);
    const variables = requestVariables(http);
    expect(variables).toContainEqual({ period: 'DAY' });
    expect(variables).toContainEqual(
      expect.objectContaining({
        orderBy: { field: 'POPULARITY_SCORE', direction: 'DESC' },
        type: { include: ['MANHWA'], exclude: [] },
      }),
    );
  });

  it('Senkuro: «Самое читаемое» takes the period, catalog blocks page on', async () => {
    const http = new FakeHttpClient();
    registerHome(http);
    const parser = createSenkuroParser(SENKURO_CONFIG, makeContext(http));

    const mostRead = await parser.getHomeSection!('mostRead', { page: 1, variant: 'month' });
    const newest = await parser.getHomeSection!('newest', { page: 1 });

    expect(mostRead).toEqual({ items: expect.any(Array), hasNextPage: false });
    expect(newest?.items).toHaveLength(1);
    expect(requestVariables(http)).toEqual([
      { period: 'MONTH' },
      expect.objectContaining({ orderBy: { field: 'CREATED_AT', direction: 'DESC' } }),
    ]);
  });

  it('Senkognito: no «Самое читаемое» — the backend answers it with Senkuro titles', async () => {
    const http = new FakeHttpClient();
    registerHome(http);
    const parser = createSenkuroParser(SENKOGNITO_CONFIG, makeContext(http, 'ne.senkognito.com'));

    const { sections, problems } = await checkHome(parser);

    expect(problems).toEqual([]);
    expect(sections.map(({ id }) => id)).not.toContain('mostRead');
    expect(http.requests.some(({ body }) => body?.includes('fetchPopularMangaByPeriod'))).toBe(
      false,
    );
    expect(await parser.getHomeSection!('mostRead', { page: 1 })).toBeNull();
  });
});

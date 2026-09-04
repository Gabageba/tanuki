import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { FILTER_TYPE, MANGA_TYPE } from '@tanuki/contracts';
import { createTomiloLibParser, TOMILOLIB_FILTER_GROUP } from '../src/sources/tomilolib';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'tomilo-lib.example';
const TITLE_ID = 'title-1';

const LIST_JSON = JSON.stringify({
  data: {
    titles: [
      {
        _id: TITLE_ID,
        slug: 'one-piece',
        name: 'Ван-Пис',
        coverImage: '/uploads/titles/1/cover.jpg',
        genres: ['Приключения'],
        averageRating: 8.5,
        status: 'ongoing',
        type: 'manga',
        releaseYear: 1997,
        totalChapters: 1100,
        description: 'Описание из списка.',
      },
    ],
  },
});

const DETAILS_JSON = JSON.stringify({
  data: {
    _id: TITLE_ID,
    slug: 'one-piece',
    name: 'Ван-Пис',
    coverImage: '/uploads/titles/1/cover.jpg',
    genres: ['Приключения'],
    averageRating: 8.7,
    status: 'ongoing',
    description: 'Описание тайтла.',
    chapters: [
      { _id: 'ch-2', isPublished: true, chapterNumber: 2, releaseDate: '2024-01-02T10:00:00.000Z' },
      { _id: 'ch-1', isPublished: true, chapterNumber: 1, releaseDate: '2024-01-01T09:30:00.000Z' },
    ],
  },
});

const PAGES_JSON = JSON.stringify({
  data: { pages: ['/chapters/ch-1/001.webp', '/chapters/ch-1/002.webp'] },
});

const FILTER_OPTIONS_JSON = JSON.stringify({
  data: {
    genres: ['Приключения', 'Драма'],
    types: ['manga', 'manhwa', 'manhua', 'comic'],
    status: ['ongoing', 'completed', 'pause', 'cancelled'],
    tags: [],
    releaseYears: [2010, 2015, 2024],
    ageLimits: [0, 12, 16, 18],
    chaptersMin: 1,
    chaptersMax: 3864,
    sortByOptions: ['createdAt', 'updatedAt'],
  },
});

const makeContext = (http: FakeHttpClient): ParserContext => {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
};

const setUpFixtures = (): FakeHttpClient => {
  const http = new FakeHttpClient();
  http.register((url) => url.includes('/api/chapters/ch-1'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/titles/slug/one-piece'), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/titles?'), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/titles/filters/options'), {
    status: 200,
    body: FILTER_OPTIONS_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('TomiloLib parser conformance', () => {
  const http = setUpFixtures();
  const parser = createTomiloLibParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.TOMILOLIB);
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.coverUrl).toBe('https://s3.regru.cloud/tomilolib/titles/1/cover.jpg');
    expect(item!.type).toBe(MANGA_TYPE.MANGA);
    expect(item!.year).toBe(1997);
    expect(item!.chaptersCount).toBe(1100);
    expect(item!.description).toBe('Описание из списка.');
    expect(item!.state).toBe('ongoing');
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/titles/one-piece');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/titles/one-piece');
    const chapter1 = manga.chapters!.find((c) => c.number === 1)!;
    const pages = await parser.getPages(chapter1.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://s3.regru.cloud/tomilolib/chapters/ch-1/001.webp');
  });

  it('getFilters: genre fetched live, type/status hardcoded, plus two RANGE groups', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      TOMILOLIB_FILTER_GROUP.GENRE,
      TOMILOLIB_FILTER_GROUP.TYPE,
      TOMILOLIB_FILTER_GROUP.STATUS,
      TOMILOLIB_FILTER_GROUP.RELEASE_YEAR,
      TOMILOLIB_FILTER_GROUP.CHAPTERS_COUNT,
    ]);

    const genre = groups.find((g) => g.id === TOMILOLIB_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX);
    expect(genre.options).toEqual([
      { key: 'Приключения', title: 'Приключения', count: null },
      { key: 'Драма', title: 'Драма', count: null },
    ]);

    const type = groups.find((g) => g.id === TOMILOLIB_FILTER_GROUP.TYPE)!;
    expect(type.type).toBe(FILTER_TYPE.RADIO);
    expect(type.options.map((o) => o.key)).toEqual(['manga', 'manhwa', 'manhua', 'comic']);

    const status = groups.find((g) => g.id === TOMILOLIB_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.RADIO);
    expect(status.options.map((o) => o.key)).toEqual([
      'ongoing',
      'completed',
      'pause',
      'cancelled',
    ]);

    const releaseYear = groups.find((g) => g.id === TOMILOLIB_FILTER_GROUP.RELEASE_YEAR)!;
    expect(releaseYear.type).toBe(FILTER_TYPE.RANGE);
    expect(releaseYear.options).toEqual([]);
    expect(releaseYear.settings?.range).toMatchObject({ min: 2010, format: 'year' });

    const chaptersCount = groups.find((g) => g.id === TOMILOLIB_FILTER_GROUP.CHAPTERS_COUNT)!;
    expect(chaptersCount.type).toBe(FILTER_TYPE.RANGE);
    expect(chaptersCount.settings?.range).toEqual({ min: 1, max: 3864 });
  });

  it('getList with filters: genres comma-joined, type/status single-valued, ranges via From/To', async () => {
    await parser.getList({
      offset: 0,
      limit: 24,
      filters: [
        { groupId: TOMILOLIB_FILTER_GROUP.GENRE, key: 'Приключения' },
        { groupId: TOMILOLIB_FILTER_GROUP.GENRE, key: 'Драма' },
        { groupId: TOMILOLIB_FILTER_GROUP.TYPE, key: 'manhwa' },
        { groupId: TOMILOLIB_FILTER_GROUP.STATUS, key: 'ongoing' },
        { groupId: TOMILOLIB_FILTER_GROUP.RELEASE_YEAR, range: { min: 2015 } },
        { groupId: TOMILOLIB_FILTER_GROUP.CHAPTERS_COUNT, range: { max: 200 } },
      ],
    });
    const listRequest = http.requests.filter((r) => r.url.includes('/api/titles?')).at(-1)!;
    const url = new URL(listRequest.url);
    expect(url.searchParams.get('genres')).toBe('Приключения,Драма');
    expect(url.searchParams.get('type')).toBe('manhwa');
    expect(url.searchParams.get('status')).toBe('ongoing');
    expect(url.searchParams.get('releaseYearFrom')).toBe('2015');
    expect(url.searchParams.get('chaptersTo')).toBe('200');
  });
});

import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_STATE,
  TITLE_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
} from '@tanuki/contracts';
import { createWaMangaParser, WAMANGA_FILTER_GROUP } from '../src/sources/wamanga';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'wamanga.example';
const MANGA_ID = 'manga-1';
const MANGA_SLUG = 'one-piece';
const MANGA_URL = `manga,,${MANGA_SLUG}`;

const LIST_JSON = JSON.stringify([
  {
    id: MANGA_ID,
    slug: MANGA_SLUG,
    title: 'Ван-Пис',
    titleEnglish: 'One Piece',
    coverUrl: '/covers/op.jpg',
    genres: ['приключения'],
    statusTitle: 'ongoing',
    translationStatus: 'completed',
    authors: ['Oda Eiichiro'],
    artists: ['Oda Eiichiro'],
    publishers: ['Shueisha'],
    isAdult: false,
    year: 1997,
    type: 'manga',
    pegiRating: '16+',
    likes: 26,
    views: 9276,
    createdAt: '2024-01-01T09:30:00.000Z',
  },
]);

const DETAILS_JSON = JSON.stringify({
  id: MANGA_ID,
  slug: MANGA_SLUG,
  title: 'Ван-Пис',
  titleEnglish: 'One Piece',
  coverUrl: '/covers/op.jpg',
  imageUrl: '/covers/op-full.jpg',
  genres: ['приключения'],
  statusTitle: 'ongoing',
  translationStatus: 'completed',
  authors: ['Oda Eiichiro'],
  artists: ['Oda Eiichiro'],
  publishers: ['Shueisha'],
  isAdult: false,
  description: 'Описание тайтла.',
  teams: [{ name: 'TeamA' }],
  year: 1997,
  type: 'manga',
  pegiRating: '16+',
  likes: 26,
  views: 9276,
  createdAt: '2024-01-01T09:30:00.000Z',
  chapters: [
    { id: 'ch-1', position: 1, title: 'Глава 1', createdAt: '2024-01-01T09:30:00.000Z' },
    { id: 'ch-2', position: 2, title: 'Глава 2', createdAt: '2024-01-02T10:00:00.000Z' },
  ],
});

const PAGES_JSON = JSON.stringify({
  files: [{ diskFile: '/files/001.jpg' }, { diskFile: '/files/002.jpg' }],
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
  http.register((url) => url.includes('/chapters/ch-1'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes(`/manga/get/manga/${MANGA_SLUG}`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/v1/manga?'), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('WaManga parser conformance', () => {
  const http = setUpFixtures();
  const parser = createWaMangaParser(makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.WAMANGA);
    expect(item!.rating).toBe(-1);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.altTitles).toEqual(['One Piece']);
    expect(item!.contentRating).toBe(CONTENT_RATING.SUGGESTIVE);
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
    expect(item!.year).toBe(1997);
    expect(item!.likes).toBe(26);
    expect(item!.views).toBe(9276);
    expect(item!.artists).toEqual(['Oda Eiichiro']);
    expect(item!.publishers).toEqual(['Shueisha']);
    expect(item!.translationState).toBe(TITLE_STATE.FINISHED);
    expect(item!.addedAt).toBeGreaterThan(0);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails(MANGA_URL);
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      expect(chapter.scanlator).toBe('TeamA');
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title)).toEqual(['Приключения']);
    expect(manga.translators).toEqual(['TeamA']);
    expect(manga.views).toBe(9276);
    expect(manga.likes).toBe(26);
    expect(manga.translationState).toBe(TITLE_STATE.FINISHED);
  });

  it('getList: pegiRating maps to contentRating tiers, isAdult overrides to adult', async () => {
    const cases: [string | undefined, boolean, string][] = [
      ['3+', false, CONTENT_RATING.SAFE],
      ['6+', false, CONTENT_RATING.SAFE],
      ['12+', false, CONTENT_RATING.SUGGESTIVE],
      ['16+', false, CONTENT_RATING.SUGGESTIVE],
      ['18+', false, CONTENT_RATING.ADULT],
      ['6+', true, CONTENT_RATING.ADULT],
      [undefined, false, CONTENT_RATING.SAFE],
    ];
    for (const [pegiRating, isAdult, expected] of cases) {
      const fresh = new FakeHttpClient();
      fresh.register((url) => url.includes('/api/v1/manga?'), {
        status: 200,
        body: JSON.stringify([
          { id: MANGA_ID, slug: 'one-piece', title: 'Ван-Пис', pegiRating, isAdult },
        ]),
        contentType: 'application/json',
      });
      const items = await createWaMangaParser(makeContext(fresh)).getList({ offset: 0, limit: 20 });
      expect(items[0]!.contentRating).toBe(expected);
    }
  });

  it('getList: defaults to updatedAt desc, maps the other sort orders', async () => {
    const cases: [string | undefined, string, string][] = [
      [undefined, 'updatedAt', 'true'],
      [SORT_ORDER.UPDATED, 'updatedAt', 'true'],
      [SORT_ORDER.RELEASED, 'publicDate', 'true'],
      [SORT_ORDER.ADDED, 'createdAt', 'true'],
      [SORT_ORDER.POPULARITY, 'views', 'true'],
      [SORT_ORDER.LIKES, 'likes', 'true'],
      [SORT_ORDER.ALPHABETICAL, 'alphabetical', 'false'],
    ];
    for (const [order, key, descending] of cases) {
      const fresh = setUpFixtures();
      await createWaMangaParser(makeContext(fresh)).getList({ offset: 0, limit: 20, order });
      const url = new URL(fresh.requests[0]!.url);
      expect(url.searchParams.get('sortKey')).toBe(key);
      expect(url.searchParams.get('sortDescending')).toBe(descending);
    }
  });

  it("getList: explicit direction overrides each sort order's default", async () => {
    const cases: [string | undefined, string, string][] = [
      [SORT_ORDER.UPDATED, SORT_DIRECTION.ASC, 'false'],
      [SORT_ORDER.RELEASED, SORT_DIRECTION.ASC, 'false'],
      [SORT_ORDER.POPULARITY, SORT_DIRECTION.ASC, 'false'],
      [SORT_ORDER.ALPHABETICAL, SORT_DIRECTION.DESC, 'true'],
    ];
    for (const [order, direction, descending] of cases) {
      const fresh = setUpFixtures();
      await createWaMangaParser(makeContext(fresh)).getList({
        offset: 0,
        limit: 20,
        order,
        direction,
      });
      const url = new URL(fresh.requests[0]!.url);
      expect(url.searchParams.get('sortDescending')).toBe(descending);
    }
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const pages = await parser.getPages('ch-1');
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/files/001.jpg`);
  });

  it('getFilters: type/status/translationStatus/pegiRating checkboxes plus a year RANGE', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      WAMANGA_FILTER_GROUP.TYPE,
      WAMANGA_FILTER_GROUP.STATUS,
      WAMANGA_FILTER_GROUP.TRANSLATION_STATUS,
      WAMANGA_FILTER_GROUP.AGE_RATING,
      WAMANGA_FILTER_GROUP.RELEASE_YEAR,
    ]);

    const type = groups.find((g) => g.id === WAMANGA_FILTER_GROUP.TYPE)!;
    expect(type.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(type.options.map((o) => o.key)).toEqual([
      'manga',
      'manhwa',
      'manhua',
      'comic',
      'manuscript',
    ]);

    const status = groups.find((g) => g.id === WAMANGA_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options.map((o) => o.key)).toEqual([
      'announced',
      'ongoing',
      'hiatus',
      'completed',
      'abandoned',
      'cancelled',
      'unknown',
    ]);

    const translationStatus = groups.find((g) => g.id === WAMANGA_FILTER_GROUP.TRANSLATION_STATUS)!;
    expect(translationStatus.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(translationStatus.options).toEqual(status.options);

    const ageRating = groups.find((g) => g.id === WAMANGA_FILTER_GROUP.AGE_RATING)!;
    expect(ageRating.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(ageRating.options.map((o) => o.key)).toEqual(['3+', '6+', '12+', '16+', '18+']);

    const releaseYear = groups.find((g) => g.id === WAMANGA_FILTER_GROUP.RELEASE_YEAR)!;
    expect(releaseYear.type).toBe(FILTER_TYPE.RANGE);
    expect(releaseYear.options).toEqual([]);
    expect(releaseYear.settings?.range).toMatchObject({ min: 1990, format: 'year' });
  });

  it('getList with filters: types/statuses/translationStatuses/pegiRatings repeated, year via From/To', async () => {
    const fresh = setUpFixtures();
    await createWaMangaParser(makeContext(fresh)).getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: WAMANGA_FILTER_GROUP.TYPE, key: 'manhwa' },
        { groupId: WAMANGA_FILTER_GROUP.TYPE, key: 'manga' },
        { groupId: WAMANGA_FILTER_GROUP.STATUS, key: 'ongoing' },
        { groupId: WAMANGA_FILTER_GROUP.TRANSLATION_STATUS, key: 'completed' },
        { groupId: WAMANGA_FILTER_GROUP.AGE_RATING, key: '16+' },
        { groupId: WAMANGA_FILTER_GROUP.RELEASE_YEAR, range: { min: 2015, max: 2020 } },
      ],
    });
    const url = new URL(fresh.requests[0]!.url);
    expect(url.searchParams.getAll('types')).toEqual(['manhwa', 'manga']);
    expect(url.searchParams.getAll('statuses')).toEqual(['ongoing']);
    expect(url.searchParams.getAll('translationStatuses')).toEqual(['completed']);
    expect(url.searchParams.getAll('pegiRatings')).toEqual(['16+']);
    expect(url.searchParams.get('releaseYearFrom')).toBe('2015');
    expect(url.searchParams.get('releaseYearTo')).toBe('2020');
  });
});

import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createLibSocialParser, LIBSOCIAL_FILTER_GROUP } from '../src/sources/libsocial/engine';
import type { LibSocialConfig } from '../src/sources/libsocial/config';
import { LIBSOCIAL_API_HOST } from '../src/sources/libsocial/config';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';
import { readFixture } from './support/fixtures';
import {
  FILTER_TYPE,
  TITLE_RESTRICTION,
  TITLE_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
} from '@tanuki/contracts';

const DOMAIN = 'mangalib.org';
const SLUG = '123--one-piece';

const CFG: LibSocialConfig = {
  id: SOURCE_ID.MANGALIB,
  siteId: 1,
  isNsfw: false,
  authRequiredOnMissingPages: true,
};

const LIST_JSON = JSON.stringify({
  data: [
    {
      id: 123,
      name: 'One Piece',
      rus_name: 'Ван-Пис',
      slug_url: SLUG,
      cover: {
        thumbnail: `https://${LIBSOCIAL_API_HOST}/uploads/123-thumb.jpg`,
        default: `https://${LIBSOCIAL_API_HOST}/uploads/123-full.jpg`,
      },
      rating: { average: 8.5 },
      status: { id: 1 },
      type: { id: 5 },
    },
  ],
});

const DETAILS_JSON = JSON.stringify({
  data: {
    id: 123,
    name: 'One Piece',
    rus_name: 'Ван-Пис',
    eng_name: 'One Piece',
    otherNames: ['Wan Pīsu', 'Большой куш'],
    cover: {
      thumbnail: `https://${LIBSOCIAL_API_HOST}/uploads/123-thumb.jpg`,
      default: `https://${LIBSOCIAL_API_HOST}/uploads/123-full.jpg`,
    },
    genres: [{ id: 34, name: 'Приключения' }],
    tags: [{ id: 56, name: 'Пираты' }],
    authors: [{ name: 'Oda Eiichiro' }],
    artists: [{ name: 'Oda Eiichiro' }],
    publisher: [{ name: 'Shueisha' }],
    teams: [{ name: 'TeamA' }],
    format: [{ name: 'В цвете' }],
    releaseDate: '1997',
    views: { total: 32161893 },
    summary: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Первый абзац.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Второй абзац.' }] },
      ],
    },
    close_view: 0,
    rating: { average: 8.7, votes: 35800 },
    status: { id: 1 },
    ageRestriction: { id: 1 },
    type: { id: 1 },
  },
});

const CHAPTERS_JSON = JSON.stringify({
  data: [
    {
      // Sent as strings live for some manga (e.g. HENTAILIB) instead of the usual JSON numbers.
      volume: '1',
      number: '2',
      name: null,
      branches: [
        {
          id: 9002,
          branch_id: 0,
          teams: [{ name: 'TeamA' }],
          created_at: '2024-01-02T10:00:00.000Z',
        },
      ],
    },
    {
      volume: 1,
      number: 1,
      name: null,
      branches: [
        {
          id: 9001,
          branch_id: 0,
          teams: [{ name: 'TeamA' }],
          created_at: '2024-01-01T09:30:00.000Z',
        },
      ],
    },
  ],
});

const IMAGE_SERVERS_JSON = JSON.stringify({
  data: {
    imageServers: [
      { id: 'main', url: 'https://img1.example/', site_ids: [1] },
      { id: 'compress', url: 'https://img1-thumb.example/', site_ids: [1] },
    ],
  },
});

const PAGES_JSON = JSON.stringify({
  data: {
    pages: [
      { id: 1, url: '001.jpg' },
      { id: 2, url: '002.jpg' },
    ],
  },
});

// site_ids scope these to the whole LibSocial network — only the entries carrying CFG.siteId (1)
// belong in MANGALIB's own filter list. Served from /api/constants (not /api/genres, /api/tags —
// those 403 anonymously with "User is not logged in").
const CONSTANTS_FILTERS_JSON = JSON.stringify({
  data: {
    genres: [
      { id: 34, name: 'Приключения', site_ids: [1, 2] },
      { id: 99, name: 'Хентай-жанр', site_ids: [4] },
    ],
    tags: [
      { id: 56, name: 'Пираты', site_ids: [1] },
      { id: 77, name: 'Яой-тег', site_ids: [2] },
    ],
    types: [
      { id: 1, label: 'Манга', site_ids: [1, 2, 4] },
      { id: 10, label: 'Япония', site_ids: [3] },
    ],
    format: [
      { id: 4, name: 'В цвете', site_ids: [1, 2, 4] },
      { id: 16, name: 'TV Сериал', site_ids: [5] },
    ],
    scanlateStatus: [
      { id: 2, label: 'Завершён', site_ids: [0, 1, 2, 3, 4] },
      { id: 6, label: 'Выходит', site_ids: [5] },
    ],
    ageRestriction: [
      { id: 4, label: '18+', site_ids: [1, 3, 5, 2] },
      { id: 5, label: '18+ (RX)', site_ids: [4, 2, 5] },
    ],
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
  http.register((url) => url.includes('fields[]=genres'), {
    status: 200,
    body: CONSTANTS_FILTERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/chapters'), {
    status: 200,
    body: CHAPTERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/chapter?'), {
    status: 200,
    body: PAGES_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.includes('/api/constants'), {
    status: 200,
    body: IMAGE_SERVERS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${LIBSOCIAL_API_HOST}/api/manga/${SLUG}`), {
    status: 200,
    body: DETAILS_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url.startsWith(`https://${LIBSOCIAL_API_HOST}/api/manga?`), {
    status: 200,
    body: LIST_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('LibSocial parser conformance', () => {
  const http = setUpFixtures();
  const parser = createLibSocialParser(CFG, makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.MANGALIB);
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('Ван-Пис');
    expect(item!.type).toBe(TITLE_TYPE.MANHWA);
  });

  it('getList: direction flips sort_type, defaulting to desc when unset', async () => {
    await parser.getList({ offset: 0, limit: 20, order: SORT_ORDER.RATING });
    let url = new URL(http.requests.at(-1)!.url);
    expect(url.searchParams.get('sort_by')).toBe('rate_avg');
    expect(url.searchParams.get('sort_type')).toBe('desc');

    await parser.getList({
      offset: 0,
      limit: 20,
      order: SORT_ORDER.RATING,
      direction: SORT_DIRECTION.DESC,
    });
    url = new URL(http.requests.at(-1)!.url);
    expect(url.searchParams.get('sort_type')).toBe('desc');

    await parser.getList({
      offset: 0,
      limit: 20,
      order: SORT_ORDER.RATING,
      direction: SORT_DIRECTION.ASC,
    });
    url = new URL(http.requests.at(-1)!.url);
    expect(url.searchParams.get('sort_type')).toBe('asc');

    // POPULARITY has no sort_by (the API's own default ranking) but still takes sort_type.
    await parser.getList({
      offset: 0,
      limit: 20,
      order: SORT_ORDER.POPULARITY,
      direction: SORT_DIRECTION.ASC,
    });
    url = new URL(http.requests.at(-1)!.url);
    expect(url.searchParams.get('sort_by')).toBeNull();
    expect(url.searchParams.get('sort_type')).toBe('asc');
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails(SLUG);
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
      // number/volume must come out as real numbers even when the API sends them as strings.
      expect(typeof chapter.number).toBe('number');
      expect(typeof chapter.volume).toBe('number');
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.description).toBe('Первый абзац.\n\nВторой абзац.');
    expect(manga.tags.map((t) => t.title).sort()).toEqual(['Пираты', 'Приключения']);
    expect(manga.restriction).toBeNull();
    expect(manga.type).toBe(TITLE_TYPE.MANGA);
    // name === rus_name's romanized counterpart here differs from title ('Ван-Пис'), so it
    // surfaces as originalTitle rather than getting folded into altTitles.
    expect(manga.originalTitle).toEqual(['One Piece']);
    expect(manga.altTitles.sort()).toEqual(['Wan Pīsu', 'Большой куш']);
    expect(manga.artists).toEqual(['Oda Eiichiro']);
    expect(manga.publishers).toEqual(['Shueisha']);
    expect(manga.translators).toEqual(['TeamA']);
    expect(manga.releaseFormats).toEqual(['В цвете']);
    expect(manga.year).toBe(1997);
    expect(manga.votesCount).toBe(35800);
    expect(manga.views).toBe(32161893);
  });

  it('getDetails: is_licensed with no chapters reports LEGAL restriction', async () => {
    const licensedSlug = '456--licensed-title';
    const licensedHttp = new FakeHttpClient();
    licensedHttp.register((url) => url.includes('/chapters'), {
      status: 200,
      body: JSON.stringify({ data: [] }),
      contentType: 'application/json',
    });
    licensedHttp.register(
      (url) => url.startsWith(`https://${LIBSOCIAL_API_HOST}/api/manga/${licensedSlug}`),
      {
        status: 200,
        body: JSON.stringify({
          data: {
            id: 456,
            name: 'Licensed Title',
            cover: {
              thumbnail: `https://${LIBSOCIAL_API_HOST}/uploads/456-thumb.jpg`,
              default: `https://${LIBSOCIAL_API_HOST}/uploads/456-full.jpg`,
            },
            genres: [],
            tags: [],
            authors: [],
            close_view: 0,
            is_licensed: true,
            rating: { average: 8.7 },
            status: { id: 1 },
          },
        }),
        contentType: 'application/json',
      },
    );
    const licensedParser = createLibSocialParser(CFG, makeContext(licensedHttp));

    const manga = await licensedParser.getDetails(licensedSlug);
    expect(manga.chapters).toHaveLength(0);
    expect(manga.restriction).toBe(TITLE_RESTRICTION.LEGAL);
  });

  it('getDetails: keeps purchased paid chapters marked isPaid and drops closed ones', async () => {
    const paidSlug = '789--paid';
    const paidHttp = new FakeHttpClient();
    paidHttp.register((url) => url.includes('/chapters'), {
      status: 200,
      body: JSON.stringify({
        data: [
          { volume: 1, number: 1, name: null, branches: [{ id: 1, restricted_view: null }] },
          {
            volume: 1,
            number: 2,
            name: null,
            branches: [{ id: 2, restricted_view: { is_open: true } }],
          },
          {
            volume: 1,
            number: 3,
            name: null,
            branches: [{ id: 3, restricted_view: { is_open: false } }],
          },
        ],
      }),
      contentType: 'application/json',
    });
    paidHttp.register(
      (url) => url.startsWith(`https://${LIBSOCIAL_API_HOST}/api/manga/${paidSlug}`),
      {
        status: 200,
        body: DETAILS_JSON,
        contentType: 'application/json',
      },
    );

    const manga = await createLibSocialParser(CFG, makeContext(paidHttp)).getDetails(paidSlug);
    expect(manga.hasPaidChapters).toBe(true);
    expect(manga.chapters!.map((chapter) => [chapter.number, chapter.isPaid])).toEqual([
      [1, undefined],
      [2, true],
    ]);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails(SLUG);
    const chapter2 = manga.chapters!.find((c) => c.number === 2)!;
    const pages = await parser.getPages(chapter2.url);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://img1.example/001.jpg');
    expect(pages[0]!.preview).toBe('https://img1-thumb.example/001.jpg');
  });

  it('getFilters: genre/tag/type/format/status groups scoped to siteId', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual([
      LIBSOCIAL_FILTER_GROUP.TYPE,
      LIBSOCIAL_FILTER_GROUP.GENRE,
      LIBSOCIAL_FILTER_GROUP.TAG,
      LIBSOCIAL_FILTER_GROUP.FORMAT,
      LIBSOCIAL_FILTER_GROUP.TRANSLATION_STATUS,
      LIBSOCIAL_FILTER_GROUP.STATUS,
      LIBSOCIAL_FILTER_GROUP.AGE_RESTRICTION,
      LIBSOCIAL_FILTER_GROUP.RATING,
      LIBSOCIAL_FILTER_GROUP.VOTES_COUNT,
      LIBSOCIAL_FILTER_GROUP.YEAR,
      LIBSOCIAL_FILTER_GROUP.CHAPTERS_COUNT,
      LIBSOCIAL_FILTER_GROUP.OTHER,
    ]);

    const genre = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.GENRE)!;
    expect(genre.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(genre.options).toEqual([{ key: 'g34', title: 'Приключения', count: null }]);

    const tag = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.TAG)!;
    expect(tag.type).toBe(FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE);
    expect(tag.options).toEqual([{ key: 't56', title: 'Пираты', count: null }]);

    const type = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.TYPE)!;
    expect(type.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(type.options).toEqual([{ key: '1', title: 'Манга', count: null }]);

    const format = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.FORMAT)!;
    expect(format.type).toBe(FILTER_TYPE.CHECKBOX_EXCLUDE);
    expect(format.options).toEqual([{ key: '4', title: 'В цвете', count: null }]);

    const translationStatus = groups.find(
      (g) => g.id === LIBSOCIAL_FILTER_GROUP.TRANSLATION_STATUS,
    )!;
    expect(translationStatus.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(translationStatus.options).toEqual([{ key: '2', title: 'Завершён', count: null }]);

    const status = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.STATUS)!;
    expect(status.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(status.options).toHaveLength(5);

    const ageRestriction = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.AGE_RESTRICTION)!;
    expect(ageRestriction.type).toBe(FILTER_TYPE.CHECKBOX);
    expect(ageRestriction.options).toEqual([{ key: '4', title: '18+', count: null }]);

    const other = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.OTHER)!;
    expect(other.type).toBe(FILTER_TYPE.CHECKBOX_EXCLUDE);
    expect(other.options).toEqual([
      { key: 'noTranslation', title: 'Нет перевода уже 2 месяца', count: null, excludable: false },
      { key: 'licensed', title: 'Издательский контент', count: null },
    ]);

    const rating = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.RATING)!;
    expect(rating.type).toBe(FILTER_TYPE.RANGE);
    expect(rating.settings?.range).toEqual({ min: 0, max: 10 });

    const votesCount = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.VOTES_COUNT)!;
    expect(votesCount.type).toBe(FILTER_TYPE.RANGE);
    expect(votesCount.settings?.range).toEqual({ min: 0, max: 100000 });

    const year = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.YEAR)!;
    expect(year.type).toBe(FILTER_TYPE.RANGE);
    expect(year.settings?.range.min).toBe(1900);

    const chaptersCount = groups.find((g) => g.id === LIBSOCIAL_FILTER_GROUP.CHAPTERS_COUNT)!;
    expect(chaptersCount.type).toBe(FILTER_TYPE.RANGE);
    expect(chaptersCount.settings?.range).toEqual({ min: 0, max: 10000 });
  });

  it('getList with filters: genre/tag/format route through their _exclude side, status/type/translationStatus/ageRestriction through plain params, RANGE groups through <param>_min/max', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: LIBSOCIAL_FILTER_GROUP.GENRE, key: 'g34' },
        { groupId: LIBSOCIAL_FILTER_GROUP.TAG, key: 't56', exclude: true },
        { groupId: LIBSOCIAL_FILTER_GROUP.STATUS, key: '1' },
        { groupId: LIBSOCIAL_FILTER_GROUP.TYPE, key: '1' },
        { groupId: LIBSOCIAL_FILTER_GROUP.FORMAT, key: '4', exclude: true },
        { groupId: LIBSOCIAL_FILTER_GROUP.TRANSLATION_STATUS, key: '2' },
        { groupId: LIBSOCIAL_FILTER_GROUP.AGE_RESTRICTION, key: '4' },
        { groupId: LIBSOCIAL_FILTER_GROUP.OTHER, key: 'noTranslation' },
        { groupId: LIBSOCIAL_FILTER_GROUP.OTHER, key: 'licensed' },
        { groupId: LIBSOCIAL_FILTER_GROUP.RATING, range: { min: 8 } },
        { groupId: LIBSOCIAL_FILTER_GROUP.VOTES_COUNT, range: { min: 1000, max: 1100 } },
        { groupId: LIBSOCIAL_FILTER_GROUP.YEAR, range: { min: 2015, max: 2020 } },
        { groupId: LIBSOCIAL_FILTER_GROUP.CHAPTERS_COUNT, range: { max: 50 } },
      ],
    });
    const req = http.requests.at(-1)!;
    const url = new URL(req.url);
    expect(url.searchParams.getAll('genres[]')).toEqual(['34']);
    expect(url.searchParams.getAll('tags_exclude[]')).toEqual(['56']);
    expect(url.searchParams.getAll('status[]')).toEqual(['1']);
    expect(url.searchParams.getAll('types[]')).toEqual(['1']);
    expect(url.searchParams.getAll('format_exclude[]')).toEqual(['4']);
    expect(url.searchParams.getAll('scanlate_status[]')).toEqual(['2']);
    expect(url.searchParams.getAll('caution[]')).toEqual(['4']);
    expect(url.searchParams.get('long_no_translation')).toBe('1');
    expect(url.searchParams.get('licensed')).toBe('1');
    expect(url.searchParams.get('rating_min')).toBe('8');
    expect(url.searchParams.get('rating_max')).toBeNull();
    expect(url.searchParams.get('rate_min')).toBe('1000');
    expect(url.searchParams.get('rate_max')).toBe('1100');
    expect(url.searchParams.get('year_min')).toBe('2015');
    expect(url.searchParams.get('year_max')).toBe('2020');
    expect(url.searchParams.get('chap_count_max')).toBe('50');
    expect(url.searchParams.get('chap_count_min')).toBeNull();
  });
});

describe('LibSocial getHome', () => {
  it('maps the home payload into the described sections, «Сейчас читают» tabs by key', async () => {
    const http = new FakeHttpClient();
    http.register((url) => url === `https://${LIBSOCIAL_API_HOST}/api/`, {
      status: 200,
      body: readFixture('libsocial-home.json'),
      contentType: 'application/json',
    });
    const parser = createLibSocialParser(CFG, makeContext(http));

    const sections = await parser.getHome!();

    expect(sections.map(({ id }) => id)).toEqual(parser.info.homeSections.map(({ id }) => id));
    for (const section of sections) {
      expect(section.items.length).toBeGreaterThan(0);
      for (const item of section.items) {
        expect(item.chapters).toBeNull();
        expect(item.title).toBeTruthy();
        expect(item.coverUrl).toMatch(/^https:\/\//);
      }
    }
  });
});

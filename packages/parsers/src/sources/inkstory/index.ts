import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_RESTRICTION,
  MANGA_STATE,
  MANGA_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type MangaState,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import {
  CHAPTERS_COUNT_PRESETS,
  RATING_PRESETS,
  getYearRangePresets,
} from '../../core/filters/range-presets';
import { FILTER_GROUP } from '../../core/filters/group';
import type {
  RawManga,
  RawChapter,
  RawPage,
  RawTag,
  RawMangaType,
  RawFilterGroup,
  RawFilterOption,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.INKSTORY;
const PAGE_SIZE = 20;
const FIRST_PAGE = 0;
const SECRET_KEY_TTL_MS = 10 * 60 * 1000;

export const INKSTORY_FILTER_GROUP = {
  GENRE: FILTER_GROUP.GENRE,
  STATUS: FILTER_GROUP.STATUS,
  CONTENT_STATUS: FILTER_GROUP.CONTENT_STATUS,
  COUNTRY: FILTER_GROUP.COUNTRY,
  FORMAT: FILTER_GROUP.FORMAT,
  AVERAGE_RATING: FILTER_GROUP.AVERAGE_RATING,
  YEAR: FILTER_GROUP.YEAR,
  CHAPTERS_COUNT: FILTER_GROUP.CHAPTERS_COUNT,
} as const;

const YEAR_RANGE_CUTOFF = 2000;

type NameJson = {
  ru: string;
  en?: string;
};

type TagJson = {
  name: string;
  slug: string;
};

type RelationJson = {
  type?: string;
  publisher?: { name?: string };
};

type MangaJson = {
  id: string;
  name: NameJson;
  slug: string;
  averageRating?: number;
  contentStatus?: string;
  poster: string;
  labels?: TagJson[];
  status?: string;
  relations?: RelationJson[];
  description?: string;
  country?: string;
  year?: number;
  chaptersCount?: number;
};

type ChapterJson = {
  id: string;
  name?: string;
  number?: number;
  volume?: number;
  branchId: string;
  createdAt: string;
};

type PageJson = {
  id: string;
  image: string;
};

type ChapterUpdateFeedItem = {
  book: MangaJson;
};

type ContentNoticeJson = {
  id: string;
  title: string;
};

type LabelJson = {
  slug: string;
  name: string;
  kind: string;
};

const LABEL_KIND_GENRE = 'GENRE';

const STATUS_KEYS = ['ONGOING', 'DONE', 'FROZEN', 'ANNOUNCE'];
const CONTENT_STATUS_KEYS = ['SAFE', 'UNSAFE', 'EROTIC', 'PORNOGRAPHIC'];
const COUNTRY_KEYS = ['RUSSIA', 'JAPAN', 'KOREA', 'CHINA', 'OTHER'];
const FORMAT_KEYS = [
  'FOURTH_KOMA',
  'COMPILATION',
  'DOUJINSHI',
  'WEBTOON',
  'COLORED',
  'ARTBOOK',
  'SINGLE',
  'LIGHT',
  'WEB',
];

/** Mirrors the site's own hardcoded RU translations (constants chunk of the catalog filter UI) —
 *  the API only ever returns the bare enum key, never a display name, for these four groups. */
const getStatusTitle = (status: string): string => {
  switch (status) {
    case 'ONGOING':
      return 'Онгоинг';
    case 'DONE':
      return 'Завершён';
    case 'FROZEN':
      return 'Заморожен';
    case 'ANNOUNCE':
      return 'Анонс';
    default:
      return status;
  }
};

const getContentStatusTitle = (status: string): string => {
  switch (status) {
    case 'SAFE':
      return 'Безопасный';
    case 'UNSAFE':
      return 'Неприемлемый';
    case 'EROTIC':
      return 'Эротика';
    case 'PORNOGRAPHIC':
      return 'Порнография';
    default:
      return status;
  }
};

const getCountryTitle = (country: string): string => {
  switch (country) {
    case 'RUSSIA':
      return 'Россия';
    case 'JAPAN':
      return 'Япония';
    case 'KOREA':
      return 'Корея';
    case 'CHINA':
      return 'Китай';
    case 'OTHER':
      return 'Другая';
    default:
      return country;
  }
};

const getFormatTitle = (format: string): string => {
  switch (format) {
    case 'FOURTH_KOMA':
      return 'Ёнкома (4-кома)';
    case 'COMPILATION':
      return 'Сборник';
    case 'DOUJINSHI':
      return 'Додзинси';
    case 'WEBTOON':
      return 'Вебтун';
    case 'COLORED':
      return 'Цветной';
    case 'ARTBOOK':
      return 'Артбук';
    case 'SINGLE':
      return 'Сингл';
    case 'LIGHT':
      return 'Печать';
    case 'WEB':
      return 'Веб';
    default:
      return format;
  }
};

const toStaticOptions = (keys: string[], getTitle: (key: string) => string): RawFilterOption[] => {
  return keys.map((key) => ({ key, title: getTitle(key), count: null }));
};

/** Mirrors the site's own catalog sort dropdown (6 native `/v2/books` sort fields) — RATING
 *  is the site's real averageRating field, not likesCount, which is its own separate LIKES
 *  option. bookmarksCount is inferred from the same `<noun>Count` naming as views/likes/chapters.
 *  Inkstory is the only source in this repo whose native `sort` param already accepts a plain
 *  `<field>,<asc|desc>` pair, so it's the only one that actually honors ListParams.direction —
 *  see Source.supportsDirection. */
const getSortKey = (order: string | undefined, direction: string | undefined): string => {
  const dir = direction === SORT_DIRECTION.ASC ? 'asc' : 'desc';
  switch (order) {
    case SORT_ORDER.POPULARITY:
      return `viewsCount,${dir}`;
    case SORT_ORDER.LIKES:
      return `likesCount,${dir}`;
    case SORT_ORDER.CHAPTERS:
      return `chaptersCount,${dir}`;
    case SORT_ORDER.BOOKMARKS:
      return `bookmarksCount,${dir}`;
    case SORT_ORDER.RATING:
      return `averageRating,${dir}`;
    case SORT_ORDER.RELEASED:
      return `createdAt,${dir}`;
    default:
      return `updatedAt,${dir}`;
  }
};

const toMangaState = (status: string | undefined): MangaState | null => {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return MANGA_STATE.FINISHED;
    case 'ONGOING':
      return MANGA_STATE.ONGOING;
    case 'FROZEN':
      return MANGA_STATE.PAUSED;
    case 'ANNOUNCE':
      return MANGA_STATE.UPCOMING;
    default:
      return null;
  }
};

/** The API has no direct manga-type field — `country` (same vocabulary as the "Страна" filter)
 *  is what the site's own catalog derives its type badge from. */
const toMangaType = (country: string | undefined): RawMangaType | null => {
  switch (country) {
    case 'JAPAN':
      return MANGA_TYPE.MANGA;
    case 'KOREA':
      return MANGA_TYPE.MANHWA;
    case 'CHINA':
      return MANGA_TYPE.MANHUA;
    case 'RUSSIA':
      return MANGA_TYPE.COMICS;
    case 'OTHER':
      return MANGA_TYPE.OTHER;
    default:
      return null;
  }
};

const isNsfw = (contentStatus: string | undefined): boolean => {
  const upper = contentStatus?.toUpperCase();
  return upper === 'EROTIC' || upper === 'PORNOGRAPHIC';
};

/**
 * Chapter page images are served pre-XOR'd by the CDN — the site's own reader JS
 * (`useLoadImage.js`) detects this from the filename itself: strip the extension, and if the
 * remaining 36-char id has 'x' at index 14 (normally the UUID version nibble), the bytes are
 * XOR'd against a key delivered in every page's SSR payload (`"secret-key","<value>"` inside
 * the `#it-astro-state` script tag). Covers/posters don't carry this marker and are plain files.
 */
const isXorObfuscated = (imageUrl: string): boolean => {
  const filename = imageUrl.split('/').pop() ?? '';
  const id = filename.split('.')[0] ?? '';
  return id.length === 36 && id[14] === 'x';
};

const xorWithKey = (bytes: Buffer, key: string): Buffer => {
  const keyBytes = Buffer.from(key, 'utf8');
  const out = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i]! ^ keyBytes[i % keyBytes.length]!;
  }
  return out;
};

const IMAGE_MAGIC_BYTES: (readonly [number[], number])[] = [
  [[0x52, 0x49, 0x46, 0x46], 0], // RIFF (webp)
  [[0xff, 0xd8], 0], // jpeg
  [[0x89, 0x50, 0x4e, 0x47], 0], // png
];

const looksLikeImage = (bytes: Buffer): boolean => {
  return IMAGE_MAGIC_BYTES.some(([magic, offset]) =>
    magic.every((byte, i) => bytes[offset + i] === byte),
  );
};

/** Handles the fork's 6-digit-microsecond timestamps, which `Date.parse` doesn't reliably accept. */
const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z?$/.exec(value);
  if (!match) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  const [, y, mo, d, h, mi, s, frac] = match;
  const ms = frac ? Math.round(Number(`0.${frac}`) * 1000) : 0;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s), ms);
};

export const createInkStoryParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const apiHost = `api.${domain}`;
  let cachedSecretKey: { key: string; fetchedAt: number } | null = null;

  const fetchSecretKey = async (): Promise<string> => {
    // The site (behind ddos-guard) 500s any request with no User-Agent at all — unlike the
    // JSON API host, which doesn't care.
    const res = await ctx.http.get(`https://${domain}/`, {
      'User-Agent': UserAgents.CHROME_DESKTOP,
    });
    const match = /"secret-key","([^"]+)"/.exec(res.text());
    if (!match) throw new ParseError('inkstory secret-key not found in SSR payload', SOURCE_ID);
    return match[1]!;
  };

  const getSecretKey = async (forceRefresh = false): Promise<string> => {
    const isStale = !cachedSecretKey || Date.now() - cachedSecretKey.fetchedAt >= SECRET_KEY_TTL_MS;
    if (!forceRefresh && !isStale) {
      return cachedSecretKey!.key;
    }
    const key = await fetchSecretKey();
    cachedSecretKey = { key, fetchedAt: Date.now() };
    return key;
  };

  const decodeImage = async (bytes: Buffer, imageUrl: string): Promise<Buffer> => {
    if (!isXorObfuscated(imageUrl)) return bytes;
    const decoded = xorWithKey(bytes, await getSecretKey());
    if (looksLikeImage(decoded)) return decoded;
    // The site rotates this key without notice — one retry against a freshly fetched key
    // covers the case where our cached copy (up to SECRET_KEY_TTL_MS old) just went stale.
    return xorWithKey(bytes, await getSecretKey(true));
  };

  const toTag = (jo: TagJson): RawTag => {
    return { title: toTitleCase(jo.name), key: jo.slug, source: SOURCE_ID };
  };

  const toManga = (jo: MangaJson): RawManga => {
    return {
      id: generateUid(SOURCE_ID, jo.id),
      title: jo.name.ru,
      altTitles: jo.name.en ? [jo.name.en] : [],
      url: jo.id,
      publicUrl: `https://${domain}/manga/${jo.slug}`,
      rating: jo.averageRating != null ? jo.averageRating / 10 : RATING_UNKNOWN,
      contentRating: isNsfw(jo.contentStatus) ? CONTENT_RATING.ADULT : null,
      coverUrl: jo.poster,
      tags: [],
      state: toMangaState(jo.status),
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: toMangaType(jo.country),
      year: jo.year ?? null,
      chaptersCount: jo.chaptersCount ?? null,
    };
  };

  /** `/v2/books?sort=updatedAt,desc` sorts by book metadata edits, not chapter releases — the
   *  site's own "recently updated" listing instead reads this feed of latest chapter drops. */
  const fetchUpdatedPage = async (page: number): Promise<RawManga[]> => {
    const url = new URL(`https://${apiHost}/v2/chapter-update-feed`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(PAGE_SIZE));
    url.searchParams.set('onlyBorderChapters', 'true');
    url.searchParams.set('sort', 'updatedAt,desc');
    const items = await ctx.http.getJson<ChapterUpdateFeedItem[]>(url.toString());
    return items.map((item) => toManga(item.book));
  };

  /** RANGE groups address a `<param>Min`/`<param>Max` pair on the site's own API — confirmed live
   *  for all three (averageRatingMin/Max, yearMin/Max, chaptersCountMin/Max) by watching
   *  x-estimated-total-hits drop under each bound. Either side is optional — filters.ts
   *  guarantees at least one is set. */
  const applyRangeParam = (
    url: URL,
    groupId: string,
    range: { min?: number; max?: number },
  ): void => {
    let param: string;
    switch (groupId) {
      case INKSTORY_FILTER_GROUP.AVERAGE_RATING:
        param = 'averageRating';
        break;
      case INKSTORY_FILTER_GROUP.YEAR:
        param = 'year';
        break;
      case INKSTORY_FILTER_GROUP.CHAPTERS_COUNT:
        param = 'chaptersCount';
        break;
      default:
        return;
    }
    if (range.min !== undefined) url.searchParams.set(`${param}Min`, String(range.min));
    if (range.max !== undefined) url.searchParams.set(`${param}Max`, String(range.max));
  };

  /**
   * The site's own catalog UI writes filter picks straight into `/v2/books`'s query string,
   * one repeated param per group (`status=ONGOING&status=DONE`, an OR — confirmed live: the two
   * counts sum exactly to the combined-filter count) — no comma-packing like Desu's genres.
   * "genre" is the one *_EXCLUDE group: labelsInclude/labelsExclude are separate params, so no
   * marker needs packing into the key the way Desu's `id-!slug` does.
   */
  const applyFilterParams = (url: URL, filters: FilterSelection[] | undefined): void => {
    if (!filters || filters.length === 0) return;
    for (const filter of filters) {
      if ('range' in filter) {
        applyRangeParam(url, filter.groupId, filter.range);
        continue;
      }
      switch (filter.groupId) {
        case INKSTORY_FILTER_GROUP.GENRE:
          url.searchParams.append(filter.exclude ? 'labelsExclude' : 'labelsInclude', filter.key);
          break;
        case INKSTORY_FILTER_GROUP.STATUS:
          url.searchParams.append('status', filter.key);
          break;
        case INKSTORY_FILTER_GROUP.CONTENT_STATUS:
          url.searchParams.append('contentStatus', filter.key);
          break;
        case INKSTORY_FILTER_GROUP.COUNTRY:
          url.searchParams.append('country', filter.key);
          break;
        case INKSTORY_FILTER_GROUP.FORMAT:
          url.searchParams.append('formats', filter.key);
          break;
      }
    }
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const labels = await ctx.http.getJson<LabelJson[]>(`https://${apiHost}/v2/labels`);
    const genres = labels.filter((l) => l.kind === LABEL_KIND_GENRE);
    const yearMin = 1950;
    const yearMax = new Date().getFullYear();
    return [
      {
        id: INKSTORY_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres.map((l) => ({ key: l.slug, title: toTitleCase(l.name), count: null })),
      },
      {
        id: INKSTORY_FILTER_GROUP.STATUS,
        title: 'Статус',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(STATUS_KEYS, getStatusTitle),
      },
      {
        id: INKSTORY_FILTER_GROUP.CONTENT_STATUS,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(CONTENT_STATUS_KEYS, getContentStatusTitle),
      },
      {
        id: INKSTORY_FILTER_GROUP.COUNTRY,
        title: 'Страна',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(COUNTRY_KEYS, getCountryTitle),
      },
      {
        id: INKSTORY_FILTER_GROUP.FORMAT,
        title: 'Формат выпуска',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(FORMAT_KEYS, getFormatTitle),
      },
      // Bounds mirror the site's own filter inputs (see CatalogBase's number fields) — average
      // rating and chapter count are hardcoded there too, only the year cap tracks the current
      // year at each of their deploys, so it's computed here instead of pinned to today's value.
      {
        id: INKSTORY_FILTER_GROUP.AVERAGE_RATING,
        title: 'Рейтинг',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 10 }, presets: RATING_PRESETS },
      },
      {
        id: INKSTORY_FILTER_GROUP.YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: yearMin, max: yearMax, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(yearMin, yearMax, YEAR_RANGE_CUTOFF),
        },
      },
      {
        id: INKSTORY_FILTER_GROUP.CHAPTERS_COUNT,
        title: 'Число глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 10000 }, presets: CHAPTERS_COUNT_PRESETS },
      },
    ];
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
    direction: string | undefined,
  ): Promise<RawManga[]> => {
    // fetchUpdatedPage reads a dedicated "latest chapter drops" feed that has no direction
    // control of its own, so an explicit ascending request must fall through to the generic
    // /v2/books?sort=updatedAt,asc path instead.
    if (
      !query &&
      !filters?.length &&
      (order === undefined || order === SORT_ORDER.UPDATED) &&
      direction !== SORT_DIRECTION.ASC
    ) {
      return fetchUpdatedPage(page);
    }
    const url = new URL(`https://${apiHost}/v2/books`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(PAGE_SIZE));
    url.searchParams.set('type', 'COMIC');
    if (query) {
      url.searchParams.set('search', query);
    } else {
      url.searchParams.set('sort', getSortKey(order, direction));
    }
    applyFilterParams(url, filters);
    const items = await ctx.http.getJson<MangaJson[]>(url.toString());
    return items.map(toManga);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: FIRST_PAGE }, (page) =>
      fetchListPage(page, params.order, params.query, params.filters, params.direction),
    );
  };

  const getBranchName = async (branchId: string): Promise<string | null> => {
    try {
      const json = await ctx.http.getJson<{ publishers?: { name?: string }[] }>(
        `https://${apiHost}/v2/branches/${branchId}`,
      );
      return json.publishers?.[0]?.name ?? null;
    } catch {
      return branchId.split('-')[0] ?? null;
    }
  };

  const getChapters = async (mangaId: string): Promise<RawChapter[]> => {
    const url = new URL(`https://${apiHost}/v2/chapters`);
    url.searchParams.set('bookId', mangaId);
    const items = await ctx.http.getJson<ChapterJson[]>(url.toString());
    const branchNames = new Map<string, Promise<string | null>>();
    const chapters: RawChapter[] = [];
    for (const jo of items) {
      let branchPromise = branchNames.get(jo.branchId);
      if (!branchPromise) {
        branchPromise = getBranchName(jo.branchId);
        branchNames.set(jo.branchId, branchPromise);
      }
      chapters.push({
        id: generateUid(SOURCE_ID, jo.id),
        title: jo.name ?? null,
        number: jo.number ?? 0,
        volume: jo.volume ?? 0,
        url: jo.id,
        scanlator: null,
        uploadDate: parseIsoDate(jo.createdAt),
        branch: await branchPromise,
        source: SOURCE_ID,
      });
    }
    return chapters.reverse();
  };

  /** `chaptersCount` keeps counting a title's real chapters even after a rightsholder takedown
   *  wipes `/v2/chapters` — a dedicated notice at `/v2/content-notices` is what the site's own
   *  chapter-list component reads to render the "removed by request" banner in that case. */
  const hasContentNotice = async (mangaId: string): Promise<boolean> => {
    const url = new URL(`https://${apiHost}/v2/content-notices`);
    url.searchParams.set('bookId', mangaId);
    const notices = await ctx.http.getJson<ContentNoticeJson[]>(url.toString());
    return notices.length > 0;
  };

  const getDetails = async (mangaId: string): Promise<RawManga> => {
    const [chapters, jo] = await Promise.all([
      getChapters(mangaId),
      ctx.http.getJson<MangaJson>(`https://${apiHost}/v2/books/${mangaId}`),
    ]);
    const authors = (jo.relations ?? [])
      .filter((r) => r.type === 'AUTHOR')
      .map((r) => r.publisher?.name)
      .filter((n): n is string => !!n);
    const restriction =
      chapters.length === 0 && (jo.chaptersCount ?? 0) > 0 && (await hasContentNotice(mangaId))
        ? MANGA_RESTRICTION.LEGAL
        : null;

    return {
      id: generateUid(SOURCE_ID, jo.id),
      title: jo.name.ru,
      altTitles: jo.name.en ? [jo.name.en] : [],
      url: jo.id,
      publicUrl: `https://${domain}/manga/${jo.slug}`,
      rating: jo.averageRating != null ? jo.averageRating / 10 : RATING_UNKNOWN,
      contentRating: isNsfw(jo.contentStatus) ? CONTENT_RATING.ADULT : null,
      coverUrl: jo.poster,
      largeCoverUrl: null,
      tags: (jo.labels ?? []).map(toTag),
      state: toMangaState(jo.status),
      restriction,
      authors,
      description: jo.description ?? null,
      chapters,
      source: SOURCE_ID,
      type: toMangaType(jo.country),
      year: jo.year ?? null,
    };
  };

  const getPages = async (chapterId: string): Promise<RawPage[]> => {
    const json = await ctx.http.getJson<{ pages: PageJson[] }>(
      `https://${apiHost}/v2/chapters/${chapterId}`,
    );
    return json.pages.map((jo) => ({
      id: generateUid(SOURCE_ID, jo.id),
      url: jo.image,
      preview: null,
      source: SOURCE_ID,
    }));
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Inkstory',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.UPDATED,
        SORT_ORDER.LIKES,
        SORT_ORDER.CHAPTERS,
        SORT_ORDER.BOOKMARKS,
        SORT_ORDER.RATING,
        SORT_ORDER.RELEASED,
      ],
      supportsDirection: true,
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: true,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
    decodeImage,
  };
};

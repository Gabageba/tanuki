import { RAW_MANGA_STATE } from '../../types';
import { CONTENT_RATING, FILTER_TYPE, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type {
  RawManga,
  RawChapter,
  RawPage,
  RawTag,
  RawMangaState,
  RawFilterGroup,
  RawFilterOption,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';

const SOURCE_ID = 'INKSTORY';
const PAGE_SIZE = 20;
const FIRST_PAGE = 0;
const SECRET_KEY_TTL_MS = 10 * 60 * 1000;

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
 *  option. bookmarksCount is inferred from the same `<noun>Count` naming as views/likes/chapters. */
const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case 'POPULARITY':
      return 'viewsCount,desc';
    case 'LIKES':
      return 'likesCount,desc';
    case 'CHAPTERS':
      return 'chaptersCount,desc';
    case 'BOOKMARKS':
      return 'bookmarksCount,desc';
    case 'RATING':
      return 'averageRating,desc';
    case 'NEWEST':
      return 'createdAt,desc';
    default:
      return 'updatedAt,desc';
  }
};

const toMangaState = (status: string | undefined): RawMangaState | null => {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return RAW_MANGA_STATE.FINISHED;
    case 'ONGOING':
      return RAW_MANGA_STATE.ONGOING;
    case 'FROZEN':
      return RAW_MANGA_STATE.PAUSED;
    case 'ANNOUNCE':
      return RAW_MANGA_STATE.UPCOMING;
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

  /** RANGE groups address a `<groupId>Min`/`<groupId>Max` pair — confirmed live for all three
   *  (averageRatingMin/Max, yearMin/Max, chaptersCountMin/Max) by watching x-estimated-total-hits
   *  drop under each bound. Either side is optional — filters.ts guarantees at least one is set. */
  const applyRangeParam = (
    url: URL,
    groupId: string,
    range: { min?: number; max?: number },
  ): void => {
    if (groupId !== 'averageRating' && groupId !== 'year' && groupId !== 'chaptersCount') return;
    if (range.min !== undefined) url.searchParams.set(`${groupId}Min`, String(range.min));
    if (range.max !== undefined) url.searchParams.set(`${groupId}Max`, String(range.max));
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
        case 'genre':
          url.searchParams.append(filter.exclude ? 'labelsExclude' : 'labelsInclude', filter.key);
          break;
        case 'status':
          url.searchParams.append('status', filter.key);
          break;
        case 'contentStatus':
          url.searchParams.append('contentStatus', filter.key);
          break;
        case 'country':
          url.searchParams.append('country', filter.key);
          break;
        case 'format':
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
    return [
      {
        id: 'genre',
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres.map((l) => ({ key: l.slug, title: toTitleCase(l.name), count: null })),
      },
      {
        id: 'status',
        title: 'Статус',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(STATUS_KEYS, getStatusTitle),
      },
      {
        id: 'contentStatus',
        title: 'Возрастной рейтинг',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(CONTENT_STATUS_KEYS, getContentStatusTitle),
      },
      {
        id: 'country',
        title: 'Страна',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(COUNTRY_KEYS, getCountryTitle),
      },
      {
        id: 'format',
        title: 'Формат выпуска',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(FORMAT_KEYS, getFormatTitle),
      },
      // Bounds mirror the site's own filter inputs (see CatalogBase's number fields) — average
      // rating and chapter count are hardcoded there too, only the year cap tracks the current
      // year at each of their deploys, so it's computed here instead of pinned to today's value.
      {
        id: 'averageRating',
        title: 'Рейтинг',
        type: FILTER_TYPE.RANGE,
        options: [],
        range: { min: 0, max: 10 },
      },
      {
        id: 'year',
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        range: { min: 1950, max: new Date().getFullYear() },
      },
      {
        id: 'chaptersCount',
        title: 'Число глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        range: { min: 0, max: 10000 },
      },
    ];
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawManga[]> => {
    if (!query && !filters?.length && (order === undefined || order === 'UPDATED')) {
      return fetchUpdatedPage(page);
    }
    const url = new URL(`https://${apiHost}/v2/books`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(PAGE_SIZE));
    url.searchParams.set('type', 'COMIC');
    if (query) {
      url.searchParams.set('search', query);
    } else {
      url.searchParams.set('sort', getSortKey(order));
    }
    applyFilterParams(url, filters);
    const items = await ctx.http.getJson<MangaJson[]>(url.toString());
    return items.map(toManga);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: FIRST_PAGE }, (page) =>
      fetchListPage(page, params.order, params.query, params.filters),
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

  const getDetails = async (mangaId: string): Promise<RawManga> => {
    const [chapters, jo] = await Promise.all([
      getChapters(mangaId),
      ctx.http.getJson<MangaJson>(`https://${apiHost}/v2/books/${mangaId}`),
    ]);
    const authors = (jo.relations ?? [])
      .filter((r) => r.type === 'AUTHOR')
      .map((r) => r.publisher?.name)
      .filter((n): n is string => !!n);

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
      authors,
      description: jo.description ?? null,
      chapters,
      source: SOURCE_ID,
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
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: false,
      sortOrders: ['UPDATED', 'POPULARITY', 'LIKES', 'CHAPTERS', 'BOOKMARKS', 'RATING', 'NEWEST'],
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

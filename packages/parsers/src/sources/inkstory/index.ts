import {
  HOME_SECTION_KIND,
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_RESTRICTION,
  TITLE_STATE,
  TITLE_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type TitleState,
  SOURCE_LOCALE,
  type TitleType,
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
import { buildSearchFilters, type SearchFilterSpec } from '../../core/filters/searchFilters';
import type {
  RawTitle,
  RawChapter,
  RawPage,
  RawTag,
  RawTitleType,
  RawContentRating,
  RawFilterGroup,
  RawFilterOption,
  RawHomeSectionPage,
  RawHomeSectionParams,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';
import { parseHtml } from '../../core/html/dom';
import { findHomeHeading } from '../../core/html/home';
import { attrOrNull, textOrNull } from '../../core/html/selectors';
import { parseFloatOrNull } from '../../core/text/numbers';
import { nullIfEmpty } from '../../core/text/strings';
import { toHomeSections, uniqueByUrl } from '../../core/home';

const SOURCE_ID = CATALOG_SOURCE_ID.INKSTORY;
const PAGE_SIZE = 20;
const FIRST_PAGE = 0;
const DECRYPTION_KEY_TTL_MS = 10 * 60 * 1000;

/** The per-site `api.<domain>` host is gone (it doesn't even resolve any more): the site now runs
 *  on the shared "inuko" platform — sso.inuko.me, static.inuko.me — whose single API serves every
 *  sibling site (puremanga, hexnovels, zenmanga, manga.ovh) out of one catalog. `serviceName` is
 *  what scopes a listing back down to this one; without it the feeds come back empty. */
const API_HOST = 'api.inuko.me';
const SERVICE_NAME = 'inkstory';

/** Блоки главной inkstory.net — проверено вживую 2026-10-12. Онгоинги и завершённые подобраны
 *  сайтом (с сортировками API не совпадают) — берутся из SSR-разметки; «Последние обновления»
 *  дорисовываются в браузере — их отдаёт та же лента глав, что сортировка каталога «обновлено». */
export const INKSTORY_HOME_SECTION = {
  POPULAR_ONGOINGS: 'popularOngoings',
  BEST_FINISHED: 'bestFinished',
  RECENTLY_ADDED: 'recentlyAdded',
  LATEST_UPDATES: 'latestUpdates',
} as const;

const INKSTORY_HOME_SECTIONS = [
  {
    id: INKSTORY_HOME_SECTION.POPULAR_ONGOINGS,
    title: 'Популярные онгоинги',
    kind: HOME_SECTION_KIND.POPULAR,
  },
  {
    id: INKSTORY_HOME_SECTION.BEST_FINISHED,
    title: 'Лучшие завершенные',
    kind: HOME_SECTION_KIND.TOP,
  },
  {
    id: INKSTORY_HOME_SECTION.RECENTLY_ADDED,
    title: 'Недавно добавлено',
    kind: HOME_SECTION_KIND.NEW,
  },
  {
    id: INKSTORY_HOME_SECTION.LATEST_UPDATES,
    title: 'Последние обновления каталога',
    kind: HOME_SECTION_KIND.UPDATES,
  },
];

/** Обложка карточки — `static.inuko.me/book/<id книги>/poster/...`: id книги тот же, что в API. */
const BOOK_ID_FROM_COVER_REGEX = /\/book\/([0-9a-f-]{36})\//;

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
  /** Native-script title — kept separate from `en` because the site's own header shows both,
   *  "<en> / <original>", as two facets of "the original name" rather than alternates of it. */
  original?: string;
};

type AltNameJson = {
  language: string;
  name: string;
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
  altNames?: AltNameJson[];
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
  formats?: string[];
  chaptersCount?: number;
  viewsCount?: number;
  likesCount?: number;
  ratingVotesCount?: number;
  createdAt?: string;
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

const toMangaState = (status: string | undefined): TitleState | null => {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return TITLE_STATE.FINISHED;
    case 'ONGOING':
      return TITLE_STATE.ONGOING;
    case 'FROZEN':
      return TITLE_STATE.PAUSED;
    case 'ANNOUNCE':
      return TITLE_STATE.UPCOMING;
    default:
      return null;
  }
};

/** The API has no direct manga-type field — `country` (same vocabulary as the "Страна" filter)
 *  is what the site's own catalog derives its type badge from. */
const toMangaType = (country: string | undefined): RawTitleType | null => {
  switch (country) {
    case 'JAPAN':
      return TITLE_TYPE.MANGA;
    case 'KOREA':
      return TITLE_TYPE.MANHWA;
    case 'CHINA':
      return TITLE_TYPE.MANHUA;
    case 'RUSSIA':
      return TITLE_TYPE.COMICS;
    case 'OTHER':
      return TITLE_TYPE.OTHER;
    default:
      return null;
  }
};

/** contentStatus is a 4-value scale (see CONTENT_STATUS_KEYS), not a boolean — UNSAFE ("16+"-ish
 *  suggestive content) was previously falling through to null/SAFE alongside EROTIC and
 *  PORNOGRAPHIC being merged into one ADULT bucket, which is still correct: the site's own UI
 *  doesn't distinguish between the two beyond the shared 18+ marker. */
const toContentRating = (contentStatus: string | undefined): RawContentRating | null => {
  switch (contentStatus?.toUpperCase()) {
    case 'SAFE':
      return CONTENT_RATING.SAFE;
    case 'UNSAFE':
      return CONTENT_RATING.SUGGESTIVE;
    case 'EROTIC':
    case 'PORNOGRAPHIC':
      return CONTENT_RATING.ADULT;
    default:
      return null;
  }
};

/** The site's header shows both the English name and the native-script one side by side — two
 *  equally "original" facets, distinct from the RU title and from altNames, neither one more
 *  canonical than the other, so both go in as separate entries rather than one glued string. */
const toOriginalTitle = (name: NameJson): string[] => {
  return [name.en, name.original].filter((v): v is string => !!v);
};

/**
 * Chapter page images are served pre-XOR'd by the CDN — the site's own reader JS
 * detects this from the filename itself: strip the extension, and if the remaining 36-char id has
 * 'x' at index 14 (normally the UUID version nibble), the bytes are XOR'd against a key delivered
 * in every page's SSR payload (`decryptionKey:"<value>"` in the inlined router state).
 * Covers/posters don't carry this marker and are plain files.
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

const getInkStoryTypeKeys = (value: TitleType): string[] => {
  switch (value) {
    case TITLE_TYPE.MANGA:
      return ['JAPAN'];
    case TITLE_TYPE.MANHWA:
      return ['KOREA'];
    case TITLE_TYPE.MANHUA:
      return ['CHINA'];
    case TITLE_TYPE.COMICS:
      return ['RUSSIA'];
    case TITLE_TYPE.OTHER:
      return ['OTHER'];
  }
};

const getInkStoryStateKeys = (value: TitleState): string[] => {
  switch (value) {
    case TITLE_STATE.ONGOING:
      return ['ONGOING'];
    case TITLE_STATE.FINISHED:
      return ['DONE'];
    case TITLE_STATE.PAUSED:
      return ['FROZEN'];
    case TITLE_STATE.ABANDONED:
      return [];
    case TITLE_STATE.UPCOMING:
      return ['ANNOUNCE'];
  }
};

/** Search criteria -> this source's own filter groups (see resolveSearchFilters). */
const SEARCH_FILTER_SPEC: SearchFilterSpec = {
  types: { groupId: INKSTORY_FILTER_GROUP.COUNTRY, isMultiple: true, getKeys: getInkStoryTypeKeys },
  states: {
    groupId: INKSTORY_FILTER_GROUP.STATUS,
    isMultiple: true,
    getKeys: getInkStoryStateKeys,
  },
};

export const createInkStoryParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let cachedDecryptionKey: { key: string; fetchedAt: number } | null = null;

  const apiUrl = (path: string): URL => {
    const url = new URL(`https://${API_HOST}${path}`);
    url.searchParams.set('serviceName', SERVICE_NAME);
    return url;
  };

  const fetchDecryptionKey = async (): Promise<string> => {
    // The site sits behind ddos-guard, which is far friendlier to a request carrying a real
    // browser User-Agent — unlike the JSON API host, which doesn't care.
    const res = await ctx.http.get(`https://${domain}/`, {
      'User-Agent': UserAgents.CHROME_DESKTOP,
    });
    const match = /decryptionKey:\s*"([^"]+)"/.exec(res.text());
    if (!match)
      throw new ParseError(
        `inkstory decryptionKey not found in SSR payload: https://${domain}/`,
        SOURCE_ID,
      );
    return match[1]!;
  };

  const getDecryptionKey = async (forceRefresh = false): Promise<string> => {
    const isStale =
      !cachedDecryptionKey || Date.now() - cachedDecryptionKey.fetchedAt >= DECRYPTION_KEY_TTL_MS;
    if (!forceRefresh && !isStale) {
      return cachedDecryptionKey!.key;
    }
    const key = await fetchDecryptionKey();
    cachedDecryptionKey = { key, fetchedAt: Date.now() };
    return key;
  };

  const decodeImage = async (bytes: Buffer, imageUrl: string): Promise<Buffer> => {
    if (!isXorObfuscated(imageUrl)) return bytes;
    const decoded = xorWithKey(bytes, await getDecryptionKey());
    if (looksLikeImage(decoded)) return decoded;
    // The site rotates this key without notice — one retry against a freshly fetched key
    // covers the case where our cached copy (up to DECRYPTION_KEY_TTL_MS old) just went stale.
    return xorWithKey(bytes, await getDecryptionKey(true));
  };

  const toTag = (jo: TagJson): RawTag => {
    return { title: toTitleCase(jo.name), key: jo.slug, source: SOURCE_ID };
  };

  /** Every field here is present on both `/v2/books` list items and the `/v2/books/{id}` detail
   *  payload — getDetails only has to add the fields that need `relations` or the chapters list,
   *  which list items don't carry. */
  const mapMangaCommon = (jo: MangaJson): RawTitle => {
    return {
      id: generateUid(SOURCE_ID, jo.id),
      title: jo.name.ru,
      originalTitle: toOriginalTitle(jo.name),
      altTitles: (jo.altNames ?? []).map((a) => a.name),
      url: jo.id,
      // The site's own routing serves a title's page at /content/<slug> — /manga/<slug> 404s.
      publicUrl: `https://${domain}/content/${jo.slug}`,
      rating: jo.averageRating != null ? jo.averageRating / 10 : RATING_UNKNOWN,
      contentRating: toContentRating(jo.contentStatus),
      coverUrl: jo.poster,
      tags: [],
      releaseState: toMangaState(jo.status),
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: toMangaType(jo.country),
      country: jo.country ? getCountryTitle(jo.country) : null,
      year: jo.year ?? null,
      releaseFormats: (jo.formats ?? []).map(getFormatTitle),
      chaptersCount: jo.chaptersCount ?? null,
      votesCount: jo.ratingVotesCount ?? null,
      likes: jo.likesCount ?? null,
      views: jo.viewsCount ?? null,
      addedAt: jo.createdAt ? parseIsoDate(jo.createdAt) : undefined,
    };
  };

  const toManga = (jo: MangaJson): RawTitle => mapMangaCommon(jo);

  /** `/v2/books?sort=updatedAt,desc` sorts by book metadata edits, not chapter releases — the
   *  site's own "recently updated" listing instead reads this feed of latest chapter drops. */
  const fetchUpdatedPage = async (page: number): Promise<RawTitle[]> => {
    const url = apiUrl('/v2/chapter-update-feed');
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
    const labels = await ctx.http.getJson<LabelJson[]>(apiUrl('/v2/labels').toString());
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
  ): Promise<RawTitle[]> => {
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
    const url = apiUrl('/v2/books');
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

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: FIRST_PAGE }, (page) =>
      fetchListPage(page, params.order, params.query, params.filters, params.direction),
    );
  };

  const getBranchName = async (branchId: string): Promise<string | null> => {
    try {
      const json = await ctx.http.getJson<{ publishers?: { name?: string }[] }>(
        apiUrl(`/v2/branches/${branchId}`).toString(),
      );
      return json.publishers?.[0]?.name ?? null;
    } catch {
      return branchId.split('-')[0] ?? null;
    }
  };

  const getChapters = async (mangaId: string): Promise<RawChapter[]> => {
    const url = apiUrl('/v2/chapters');
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
      // Ветка у Inkstory и есть команда перевода — остальные источники с ветками (grouple,
      // libsocial, remanga) отдают то же имя и в scanlator, поэтому оно дублируется и здесь.
      const branch = await branchPromise;
      chapters.push({
        id: generateUid(SOURCE_ID, jo.id),
        title: jo.name ?? null,
        number: jo.number ?? null,
        volume: jo.volume ?? null,
        url: jo.id,
        scanlator: branch,
        uploadDate: parseIsoDate(jo.createdAt),
        branch,
        source: SOURCE_ID,
      });
    }
    return chapters.reverse();
  };

  /** `chaptersCount` keeps counting a title's real chapters even after a rightsholder takedown
   *  wipes `/v2/chapters` — a dedicated notice at `/v2/content-notices` is what the site's own
   *  chapter-list component reads to render the "removed by request" banner in that case. */
  const hasContentNotice = async (mangaId: string): Promise<boolean> => {
    const url = apiUrl('/v2/content-notices');
    url.searchParams.set('bookId', mangaId);
    const notices = await ctx.http.getJson<ContentNoticeJson[]>(url.toString());
    return notices.length > 0;
  };

  const namesByRelationType = (relations: RelationJson[] | undefined, type: string): string[] => {
    return (relations ?? [])
      .filter((r) => r.type === type)
      .map((r) => r.publisher?.name)
      .filter((n): n is string => !!n);
  };

  const getDetails = async (mangaId: string): Promise<RawTitle> => {
    const [chapters, jo] = await Promise.all([
      getChapters(mangaId),
      ctx.http.getJson<MangaJson>(apiUrl(`/v2/books/${mangaId}`).toString()),
    ]);
    const authors = namesByRelationType(jo.relations, 'AUTHOR');
    const artists = namesByRelationType(jo.relations, 'ARTIST');
    const publishers = namesByRelationType(jo.relations, 'PUBLISHER');
    const magazines = namesByRelationType(jo.relations, 'MAGAZINE');
    // Each chapter's `branch` is already the scanlation team's own name, resolved via
    // getBranchName while building `chapters` — reusing it here is free, no extra request.
    const translators = Array.from(
      new Set(chapters.map((c) => c.branch).filter((b): b is string => !!b)),
    );
    const restriction =
      chapters.length === 0 && (jo.chaptersCount ?? 0) > 0 && (await hasContentNotice(mangaId))
        ? TITLE_RESTRICTION.LEGAL
        : null;

    return {
      ...mapMangaCommon(jo),
      tags: (jo.labels ?? []).map(toTag),
      restriction,
      authors,
      artists,
      publishers,
      magazines,
      translators,
      description: jo.description ?? null,
      chapters,
    };
  };

  const getPages = async (chapterId: string): Promise<RawPage[]> => {
    const json = await ctx.http.getJson<{ pages: PageJson[] }>(
      apiUrl(`/v2/chapters/${chapterId}`).toString(),
    );
    return json.pages.map((jo) => ({
      id: generateUid(SOURCE_ID, jo.id),
      url: jo.image,
      preview: null,
      source: SOURCE_ID,
    }));
  };

  const getHome = async () => {
    const [res, latestUpdates] = await Promise.all([
      ctx.http.get(`https://${domain}/`, { 'User-Agent': UserAgents.CHROME_DESKTOP }),
      fetchUpdatedPage(FIRST_PAGE).catch(() => []),
    ]);
    const doc = parseHtml(res.text(), `https://${domain}/`);
    const cardsAfter = (title: string): RawTitle[] => {
      // Заголовок h2 и лента — в одной колонке на два уровня выше заголовка.
      const $section = findHomeHeading(doc, 'h2', title)?.parent().parent().parent();
      const cards = ($section?.find('a[href^="/content/"]').toArray() ?? []).map((el) => {
        const $card = doc.$(el);
        const $img = $card.find('img').first();
        const src = attrOrNull($img, 'src');
        const bookId = src ? BOOK_ID_FROM_COVER_REGEX.exec(src)?.[1] : undefined;
        const name = nullIfEmpty(attrOrNull($img, 'alt') ?? '');
        if (!src || !bookId || !name) return null;
        const rating = parseFloatOrNull(textOrNull($card.find('[data-slot="badge"]').first()));
        const item: RawTitle = {
          id: generateUid(SOURCE_ID, bookId),
          title: name,
          altTitles: [],
          url: bookId,
          publicUrl: new URL(attrOrNull($card, 'href') ?? '', `https://${domain}/`).toString(),
          rating: rating !== null ? rating / 10 : RATING_UNKNOWN,
          contentRating: null,
          coverUrl: src.split('?')[0] ?? src,
          tags: [],
          releaseState: null,
          authors: [],
          largeCoverUrl: null,
          description: null,
          chapters: null,
          source: SOURCE_ID,
        };
        return item;
      });
      return uniqueByUrl(cards.filter((item): item is RawTitle => item !== null));
    };
    const titleOf = (id: string) =>
      INKSTORY_HOME_SECTIONS.find((section) => section.id === id)!.title;

    return toHomeSections(INKSTORY_HOME_SECTIONS, {
      [INKSTORY_HOME_SECTION.POPULAR_ONGOINGS]: cardsAfter(
        titleOf(INKSTORY_HOME_SECTION.POPULAR_ONGOINGS),
      ),
      [INKSTORY_HOME_SECTION.BEST_FINISHED]: cardsAfter(
        titleOf(INKSTORY_HOME_SECTION.BEST_FINISHED),
      ),
      [INKSTORY_HOME_SECTION.RECENTLY_ADDED]: cardsAfter(
        titleOf(INKSTORY_HOME_SECTION.RECENTLY_ADDED),
      ),
      [INKSTORY_HOME_SECTION.LATEST_UPDATES]: latestUpdates,
    });
  };

  /** «Последние обновления каталога» — лента глав, листается `page`; остальные блоки — из SSR
   *  главной, без продолжения. */
  const getHomeSection = async (
    id: string,
    { page }: RawHomeSectionParams,
  ): Promise<RawHomeSectionPage | null> => {
    if (id !== INKSTORY_HOME_SECTION.LATEST_UPDATES) return null;
    const items = await fetchUpdatedPage(FIRST_PAGE + page - 1);
    return { items, hasNextPage: items.length >= PAGE_SIZE };
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
      isSearchWithFiltersSupported: true,
      homeSections: INKSTORY_HOME_SECTIONS,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    getHome,
    getHomeSection,
    resolveSearchFilters: (criteria) => buildSearchFilters(criteria, SEARCH_FILTER_SPEC),
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
    decodeImage,
  };
};

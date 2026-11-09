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
  type TitleState,
  SOURCE_LOCALE,
  type TitleType,
  SOURCE_AUTH_FAMILY,
  BUILT_IN_BOOKMARK_FOLDER,
  type BuiltInBookmarkFolder,
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
  RawBookmark,
  RawBookmarkFolder,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { NotFoundError, ParseError, SourceAuthRequiredError } from '../../errors';
import { currentSourceAccount } from '../../core/source-accounts';
import { UserAgents } from '../../core/http/user-agents';
import { catalogEntryFor } from '../catalog';
import { parseHtml } from '../../core/html/dom';
import { findHomeHeading } from '../../core/html/home';
import { attrOrNull, textOrNull } from '../../core/html/selectors';
import { parseFloatOrNull } from '../../core/text/numbers';
import { nullIfEmpty } from '../../core/text/strings';
import { toHomeSections, uniqueByUrl } from '../../core/home';
import { fetchInukoViewer, findInukoSessionDomain } from './auth';
import type { InukoConfig } from './config';
import { readInukoSsr } from './ssr';

const PAGE_SIZE = 20;
const FIRST_PAGE = 0;
const DECRYPTION_KEY_TTL_MS = 10 * 60 * 1000;
/** Потолок `size` у списков API: `/v2/books` больше 100 не отдаёт (проверено 2026-10-27). */
const LIBRARY_PAGE_SIZE = 100;
/** Предохранитель листания библиотеки — 100 страниц по 100 больше любой реальной. */
const LIBRARY_MAX_PAGES = 100;
/** Сколько запросов по одному тайтлу (глава закладки, скрытая книга) уходит разом. */
const LIBRARY_REQUESTS_BATCH = 8;

/** The per-site `api.<domain>` host is gone (it doesn't even resolve any more): every site of
 *  the "inuko" network — sso.inuko.me, static.inuko.me — reads one API serving every sibling site
 *  (inkstory, puremanga, hexnovels, zenmanga, manga.ovh) out of one catalog. `serviceName` (see
 *  InukoConfig) is what scopes a listing back down to one site; without it the feeds come back
 *  empty. */
const API_HOST = 'api.inuko.me';

/** Блоки главной — одни на всю сеть: inkstory.net проверен вживую 2026-10-12, v1.puremanga.me —
 *  2026-10-27. Онгоинги и завершённые подобраны сайтом (с сортировками API не совпадают) —
 *  берутся из SSR-разметки; «Последние обновления» дорисовываются в браузере — их отдаёт та же
 *  лента глав, что сортировка каталога «обновлено». */
export const INUKO_HOME_SECTION = {
  POPULAR_ONGOINGS: 'popularOngoings',
  BEST_FINISHED: 'bestFinished',
  RECENTLY_ADDED: 'recentlyAdded',
  LATEST_UPDATES: 'latestUpdates',
} as const;

const INUKO_HOME_SECTIONS = [
  {
    id: INUKO_HOME_SECTION.POPULAR_ONGOINGS,
    title: 'Популярные онгоинги',
    kind: HOME_SECTION_KIND.POPULAR,
  },
  {
    id: INUKO_HOME_SECTION.BEST_FINISHED,
    title: 'Лучшие завершенные',
    kind: HOME_SECTION_KIND.TOP,
  },
  {
    id: INUKO_HOME_SECTION.RECENTLY_ADDED,
    title: 'Недавно добавлено',
    kind: HOME_SECTION_KIND.NEW,
  },
  {
    id: INUKO_HOME_SECTION.LATEST_UPDATES,
    title: 'Последние обновления каталога',
    kind: HOME_SECTION_KIND.UPDATES,
  },
];

/** Обложка карточки — `static.inuko.me/book/<id книги>/poster/...`: id книги тот же, что в API. */
const BOOK_ID_FROM_COVER_REGEX = /\/book\/([0-9a-f-]{36})\//;

export const INUKO_FILTER_GROUP = {
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

type ChaptersSsr = {
  chapters: ChapterJson[];
  branches: { id: string; publishers: { name: string }[] }[];
  contentNotices: ContentNoticeJson[];
};

type PageJson = {
  id: string;
  image: string;
};

type FolderJson = {
  id: string;
  name: string;
  /** Пять стандартных папок, которые сайт создаёт каждому аккаунту. */
  system: boolean;
  sortOrder: number;
};

type FolderItemJson = {
  folderId: string;
  bookId: string;
};

/** Место чтения: своя запись на каждую ветку перевода, которую человек открывал. */
type ReadingBookmarkJson = {
  bookId: string;
  chapterId: string;
  updatedAt: string;
};

type ChapterUpdateFeedItem = {
  book: MangaJson;
};

type ContentNoticeJson = {
  id: string;
  title: string;
};

type LabelJson = {
  id: string;
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

/** Стандартная папка сайта → встроенная; созданные человеком — свои папки. Сайт
 *  отдаёт имена системных папок, ключа статуса у них нет. Проверено вживую 2026-10-27. */
const getBuiltInBookmarkFolder = (folder: FolderJson): BuiltInBookmarkFolder | null => {
  if (!folder.system) return null;
  switch (folder.name) {
    case 'Читаю':
      return BUILT_IN_BOOKMARK_FOLDER.READING;
    case 'В планах':
      return BUILT_IN_BOOKMARK_FOLDER.PLANNED;
    case 'Прочитано':
      return BUILT_IN_BOOKMARK_FOLDER.COMPLETED;
    case 'Брошено':
      return BUILT_IN_BOOKMARK_FOLDER.DROPPED;
    case 'Любимые':
      return BUILT_IN_BOOKMARK_FOLDER.FAVORITE;
    default:
      return null;
  }
};

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
 *  The inuko network is the only one in this repo whose native `sort` param already accepts a plain
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

const getInukoTypeKeys = (value: TitleType): string[] => {
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

const getInukoStateKeys = (value: TitleState): string[] => {
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
  types: { groupId: INUKO_FILTER_GROUP.COUNTRY, isMultiple: true, getKeys: getInukoTypeKeys },
  states: {
    groupId: INUKO_FILTER_GROUP.STATUS,
    isMultiple: true,
    getKeys: getInukoStateKeys,
  },
};

export const createInukoParser = (config: InukoConfig, ctx: ParserContext): Parser => {
  const SOURCE_ID = config.id;
  const catalogEntry = catalogEntryFor(SOURCE_ID);
  const domain = ctx.domain;
  let cachedDecryptionKey: { key: string; fetchedAt: number } | null = null;

  const fetchSsr = async (path: string) => {
    const res = await ctx.http.get(`https://${domain}${path}`, {
      'User-Agent': UserAgents.CHROME_DESKTOP,
    });
    return readInukoSsr(res.text(), SOURCE_ID);
  };

  const apiUrl = (path: string): URL => {
    const url = new URL(`https://${API_HOST}${path}`);
    url.searchParams.set('serviceName', config.serviceName);
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
        `${SOURCE_ID} decryptionKey not found in SSR payload: https://${domain}/`,
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
      case INUKO_FILTER_GROUP.AVERAGE_RATING:
        param = 'averageRating';
        break;
      case INUKO_FILTER_GROUP.YEAR:
        param = 'year';
        break;
      case INUKO_FILTER_GROUP.CHAPTERS_COUNT:
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
        case INUKO_FILTER_GROUP.GENRE:
          url.searchParams.append(filter.exclude ? 'labelsExclude' : 'labelsInclude', filter.key);
          break;
        case INUKO_FILTER_GROUP.STATUS:
          url.searchParams.append('status', filter.key);
          break;
        case INUKO_FILTER_GROUP.CONTENT_STATUS:
          url.searchParams.append('contentStatus', filter.key);
          break;
        case INUKO_FILTER_GROUP.COUNTRY:
          url.searchParams.append('country', filter.key);
          break;
        case INUKO_FILTER_GROUP.FORMAT:
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
        id: INUKO_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres.map((l) => ({ key: l.slug, title: toTitleCase(l.name), count: null })),
      },
      {
        id: INUKO_FILTER_GROUP.STATUS,
        title: 'Статус',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(STATUS_KEYS, getStatusTitle),
      },
      {
        id: INUKO_FILTER_GROUP.CONTENT_STATUS,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(CONTENT_STATUS_KEYS, getContentStatusTitle),
      },
      {
        id: INUKO_FILTER_GROUP.COUNTRY,
        title: 'Страна',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(COUNTRY_KEYS, getCountryTitle),
      },
      {
        id: INUKO_FILTER_GROUP.FORMAT,
        title: 'Формат выпуска',
        type: FILTER_TYPE.CHECKBOX,
        options: toStaticOptions(FORMAT_KEYS, getFormatTitle),
      },
      // Bounds mirror the site's own filter inputs (see CatalogBase's number fields) — average
      // rating and chapter count are hardcoded there too, only the year cap tracks the current
      // year at each of their deploys, so it's computed here instead of pinned to today's value.
      {
        id: INUKO_FILTER_GROUP.AVERAGE_RATING,
        title: 'Рейтинг',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 10 }, presets: RATING_PRESETS },
      },
      {
        id: INUKO_FILTER_GROUP.YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: yearMin, max: yearMax, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(yearMin, yearMax, YEAR_RANGE_CUTOFF),
        },
      },
      {
        id: INUKO_FILTER_GROUP.CHAPTERS_COUNT,
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
    let items: MangaJson[];
    try {
      items = await ctx.http.getJson<MangaJson[]>(url.toString());
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      // The public API retired books/chapters; the site's SSR still exposes the same data.
      const catalogUrl = new URL(`https://${domain}/content`);
      const [sort, orderBy] = getSortKey(order, direction).split(',');
      catalogUrl.searchParams.set('sort', sort!);
      catalogUrl.searchParams.set('orderBy', orderBy!);
      catalogUrl.searchParams.set('page', String(page));
      catalogUrl.searchParams.set('size', String(PAGE_SIZE));
      if (query) catalogUrl.searchParams.set('search', query);
      applyFilterParams(catalogUrl, filters);
      for (const key of ['status', 'contentStatus', 'country', 'formats']) {
        const values = catalogUrl.searchParams.getAll(key);
        if (values.length) catalogUrl.searchParams.set(key, JSON.stringify(values));
      }
      const labelKeys = ['labelsInclude', 'labelsExclude'];
      if (labelKeys.some((key) => catalogUrl.searchParams.has(key))) {
        const labels = await ctx.http.getJson<LabelJson[]>(apiUrl('/v2/labels').toString());
        for (const key of labelKeys) {
          const values = catalogUrl.searchParams.getAll(key);
          if (values.length) {
            catalogUrl.searchParams.set(
              key,
              JSON.stringify(
                values.map((slug) => labels.find((label) => label.slug === slug)?.id ?? slug),
              ),
            );
          }
        }
      }
      const read = await fetchSsr(`${catalogUrl.pathname}${catalogUrl.search}`);
      items = read<MangaJson[]>('books');
    }
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

  const toChapter = (jo: ChapterJson, branch: string | null, url = jo.id): RawChapter => ({
    id: generateUid(SOURCE_ID, jo.id),
    title: jo.name ?? null,
    number: jo.number ?? null,
    volume: jo.volume ?? null,
    url,
    scanlator: branch,
    uploadDate: parseIsoDate(jo.createdAt),
    branch,
    source: SOURCE_ID,
  });

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
      // Ветка у сайтов inuko и есть команда перевода — остальные источники с ветками (grouple,
      // libsocial, remanga) отдают то же имя и в scanlator, поэтому оно дублируется и здесь.
      const branch = await branchPromise;
      chapters.push(toChapter(jo, branch));
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

  const fetchDetails = async (mangaId: string) => {
    try {
      const [chapters, book] = await Promise.all([
        getChapters(mangaId),
        ctx.http.getJson<MangaJson>(apiUrl(`/v2/books/${mangaId}`).toString()),
      ]);
      const restriction =
        chapters.length === 0 && (book.chaptersCount ?? 0) > 0 && (await hasContentNotice(mangaId))
          ? TITLE_RESTRICTION.LEGAL
          : null;
      return { book, chapters, restriction };
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      const read = await fetchSsr(`/content/${encodeURIComponent(mangaId)}/chapters`);
      const book = read<MangaJson>('book');
      const items = read<ChaptersSsr['chapters']>('chapters');
      const branches = read<ChaptersSsr['branches']>('branches');
      const notices = read<ChaptersSsr['contentNotices']>('contentNotices');
      const chapters = items.map((chapter): RawChapter => {
        const branch =
          branches.find(({ id }) => id === chapter.branchId)?.publishers[0]?.name ?? null;
        // Include the book in the stored URL: the reader must also work in a fresh parser.
        return toChapter(chapter, branch, `${book.id}/${chapter.id}`);
      });
      return {
        book,
        chapters,
        restriction: chapters.length === 0 && notices.length > 0 ? TITLE_RESTRICTION.LEGAL : null,
      };
    }
  };

  const getDetails = async (mangaId: string): Promise<RawTitle> => {
    const { book: jo, chapters, restriction } = await fetchDetails(mangaId);
    const authors = namesByRelationType(jo.relations, 'AUTHOR');
    const artists = namesByRelationType(jo.relations, 'ARTIST');
    const publishers = namesByRelationType(jo.relations, 'PUBLISHER');
    const magazines = namesByRelationType(jo.relations, 'MAGAZINE');
    // Each chapter's `branch` is already the scanlation team's own name, resolved via
    // getBranchName while building `chapters` — reusing it here is free, no extra request.
    const translators = Array.from(
      new Set(chapters.map((c) => c.branch).filter((b): b is string => !!b)),
    );
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
    const parts = chapterId.split('/');
    const json =
      parts.length === 2
        ? (await fetchSsr(`/content/${parts.map(encodeURIComponent).join('/')}`))<{
            pages: PageJson[];
          }>('initialChapter')
        : await ctx.http.getJson<{ pages: PageJson[] }>(
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
    const titleOf = (id: string) => INUKO_HOME_SECTIONS.find((section) => section.id === id)!.title;

    return toHomeSections(INUKO_HOME_SECTIONS, {
      [INUKO_HOME_SECTION.POPULAR_ONGOINGS]: cardsAfter(
        titleOf(INUKO_HOME_SECTION.POPULAR_ONGOINGS),
      ),
      [INUKO_HOME_SECTION.BEST_FINISHED]: cardsAfter(titleOf(INUKO_HOME_SECTION.BEST_FINISHED)),
      [INUKO_HOME_SECTION.RECENTLY_ADDED]: cardsAfter(titleOf(INUKO_HOME_SECTION.RECENTLY_ADDED)),
      [INUKO_HOME_SECTION.LATEST_UPDATES]: latestUpdates,
    });
  };

  /** «Последние обновления каталога» — лента глав, листается `page`; остальные блоки — из SSR
   *  главной, без продолжения. */
  const getHomeSection = async (
    id: string,
    { page }: RawHomeSectionParams,
  ): Promise<RawHomeSectionPage | null> => {
    if (id !== INUKO_HOME_SECTION.LATEST_UPDATES) return null;
    const items = await fetchUpdatedPage(FIRST_PAGE + page - 1);
    return { items, hasNextPage: items.length >= PAGE_SIZE };
  };

  /**
   * Все страницы списка API. Листается до пустой страницы, а не до неполной: потолок `size` у
   * эндпоинтов разный, и неполная страница ещё не значит, что дальше ничего нет.
   */
  const fetchAllPages = async <T>(path: string, params: Record<string, string>): Promise<T[]> => {
    const items: T[] = [];
    for (let page = FIRST_PAGE; page < FIRST_PAGE + LIBRARY_MAX_PAGES; page += 1) {
      const url = apiUrl(path);
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
      url.searchParams.set('page', String(page));
      url.searchParams.set('size', String(LIBRARY_PAGE_SIZE));
      const pageItems = await ctx.http.getJson<T[]>(url.toString());
      if (pageItems.length === 0) break;
      items.push(...pageItems);
    }
    return items;
  };

  /**
   * Книги по id, пачками: `/v2/books` принимает повторяющийся `id`. Книги «только в
   * библиотеке» (`readingRestriction: LIBRARY_ONLY`) список не отдаёт, хотя они лежат в папках,
   * — их добираем по одной, страницей книги (проверено 2026-10-27).
   */
  const fetchBooksById = async (bookIds: string[]): Promise<Map<string, MangaJson>> => {
    const books = new Map<string, MangaJson>();
    for (let start = 0; start < bookIds.length; start += LIBRARY_PAGE_SIZE) {
      const url = apiUrl('/v2/books');
      url.searchParams.set('size', String(LIBRARY_PAGE_SIZE));
      for (const id of bookIds.slice(start, start + LIBRARY_PAGE_SIZE)) {
        url.searchParams.append('id', id);
      }
      for (const book of await ctx.http.getJson<MangaJson[]>(url.toString())) {
        books.set(book.id, book);
      }
    }
    const missing = bookIds.filter((id) => !books.has(id));
    for (let start = 0; start < missing.length; start += LIBRARY_REQUESTS_BATCH) {
      const batch = await Promise.all(
        missing
          .slice(start, start + LIBRARY_REQUESTS_BATCH)
          .map((id) =>
            ctx.http.getJson<MangaJson>(apiUrl(`/v2/books/${id}`).toString()).catch(() => null),
          ),
      );
      for (const book of batch) if (book) books.set(book.id, book);
    }
    return books;
  };

  /**
   * Глава, на которой человек остановился в каждой книге, — из самой свежей записи места чтения.
   * Номера в записи нет, только id главы: он берётся из самой главы, по запросу на книгу.
   * Удалённая глава не валит импорт — у книги просто не будет прогресса.
   */
  const fetchReadingPositions = async (
    userId: string,
    bookIds: Set<string>,
  ): Promise<Map<string, ChapterJson>> => {
    const latest = new Map<string, ReadingBookmarkJson>();
    for (const mark of await fetchAllPages<ReadingBookmarkJson>('/v2/bookmarks', { userId })) {
      if (!bookIds.has(mark.bookId)) continue;
      const current = latest.get(mark.bookId);
      if (!current || parseIsoDate(mark.updatedAt) > parseIsoDate(current.updatedAt)) {
        latest.set(mark.bookId, mark);
      }
    }
    const marks = [...latest.values()];
    const positions = new Map<string, ChapterJson>();
    for (let start = 0; start < marks.length; start += LIBRARY_REQUESTS_BATCH) {
      const batch = marks.slice(start, start + LIBRARY_REQUESTS_BATCH);
      const chapters = await Promise.all(
        batch.map((mark) =>
          ctx.http
            .getJson<ChapterJson>(apiUrl(`/v2/chapters/${mark.chapterId}`).toString())
            .catch(() => null),
        ),
      );
      batch.forEach((mark, index) => {
        const chapter = chapters[index];
        if (chapter) positions.set(mark.bookId, chapter);
      });
    }
    return positions;
  };

  /**
   * Id аккаунта, от которого идут запросы, — по разметке страницы с его cookie сессии. Cookie
   * лежит на домене того сайта сети, с которого её перенесли, а не обязательно на этом: id
   * пользователя в сети общий, поэтому страница открывается на домене из jar.
   */
  const resolveLibraryOwnerId = async (): Promise<string> => {
    const account = currentSourceAccount(SOURCE_AUTH_FAMILY.INUKO);
    // Без аккаунта пользователя запрос ушёл бы гостем — чью библиотеку брать, неизвестно.
    const sessionDomain = account?.jar ? await findInukoSessionDomain(account.jar) : null;
    if (!sessionDomain) {
      throw new SourceAuthRequiredError('Bookmarks require the user’s own account', SOURCE_ID);
    }
    const viewer = await fetchInukoViewer(ctx.http, sessionDomain);
    if (!viewer) throw new SourceAuthRequiredError('Inuko session expired', SOURCE_ID);
    return viewer.id;
  };

  /**
   * Папки библиотеки аккаунта. Сами папки и их книги API отдаёт по id пользователя, без
   * авторизации, — сессия нужна только узнать, чей это аккаунт. `serviceName` оставляет книги
   * одного сайта: библиотека у пользователя сети общая, в ней лежат книги всех её сайтов.
   */
  const getBookmarks = async (): Promise<RawBookmarkFolder[]> => {
    const userId = await resolveLibraryOwnerId();
    const foldersUrl = apiUrl('/v2/folders');
    foldersUrl.searchParams.set('userId', userId);
    const [folders, folderItems] = await Promise.all([
      ctx.http.getJson<FolderJson[]>(foldersUrl.toString()),
      fetchAllPages<FolderItemJson>('/v2/folder-items', { userId }),
    ]);
    const bookIds = [...new Set(folderItems.map((item) => item.bookId))];
    const [books, positions] = await Promise.all([
      fetchBooksById(bookIds),
      fetchReadingPositions(userId, new Set(bookIds)),
    ]);

    const toBookmark = (bookId: string): RawBookmark | null => {
      const book = books.get(bookId);
      if (!book) return null;
      const position = positions.get(bookId);
      return {
        id: generateUid(SOURCE_ID, book.id),
        url: book.id,
        title: book.name.ru,
        coverUrl: book.poster,
        contentRating: toContentRating(book.contentStatus),
        type: toMangaType(book.country),
        lastChapterNumber: position?.number ?? null,
        lastChapterVolume: position?.volume ?? null,
      };
    };

    return [...folders]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((folder) => ({
        id: folder.id,
        builtIn: getBuiltInBookmarkFolder(folder),
        name: folder.name,
        items: folderItems
          .filter((item) => item.folderId === folder.id)
          .map((item) => toBookmark(item.bookId))
          .filter((item): item is RawBookmark => item !== null),
      }));
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: catalogEntry.title,
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: catalogEntry.contentType,
      isBroken: catalogEntry.isBroken,
      isAdult: catalogEntry.isAdult,
      requiresVpn: catalogEntry.requiresVpn,
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
      homeSections: INUKO_HOME_SECTIONS,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    getHome,
    getHomeSection,
    getBookmarks,
    resolveSearchFilters: (criteria) => buildSearchFilters(criteria, SEARCH_FILTER_SPEC),
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
    decodeImage,
  };
};

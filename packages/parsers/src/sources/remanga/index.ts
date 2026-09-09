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
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { NotFoundError } from '../../errors';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.REMANGA;
const PAGE_SIZE = 20;
const YEAR_RANGE_MIN = 1900;
const YEAR_RANGE_CUTOFF = 2000;

export const REMANGA_FILTER_GROUP = {
  GENRE: FILTER_GROUP.GENRE,
  CATEGORY: FILTER_GROUP.CATEGORY,
  TYPE: FILTER_GROUP.TYPE,
  STATUS: FILTER_GROUP.STATUS,
  AGE_RATING: FILTER_GROUP.AGE_RATING,
  TRANSLATE_STATUS: FILTER_GROUP.TRANSLATE_STATUS,
  RATING: FILTER_GROUP.RATING,
  YEAR: FILTER_GROUP.YEAR,
  CHAPTERS_COUNT: FILTER_GROUP.CHAPTERS_COUNT,
} as const;

const STATES: Record<number, MangaState> = {
  1: MANGA_STATE.FINISHED,
  2: MANGA_STATE.ONGOING,
  3: MANGA_STATE.PAUSED,
  4: MANGA_STATE.ABANDONED,
  5: MANGA_STATE.UPCOMING,
};

/** status.id === 6 ("Лицензировано") means the publisher pulled scanlations after licensing the
 *  title — not a publication state, so it maps to `restriction` instead of `releaseState`. */
const LICENSED_STATUS_ID = 6;

type CoverJson = {
  mid?: string;
  high?: string;
};

type TagJson = {
  id: number;
  name: string;
};

type StatusJson = {
  id?: number;
};

type AgeLimitJson = {
  id?: number;
};

type TypeJson = {
  id?: number;
};

type MangaJson = {
  dir: string;
  main_name: string;
  secondary_name?: string;
  another_name?: string;
  avg_rating?: number;
  cover: CoverJson;
  type?: TypeJson;
  status?: StatusJson;
  age_limit?: AgeLimitJson;
  issue_year?: number;
  genres?: TagJson[];
  description?: string;
  branches?: { id: number; publishers?: { name?: string } }[];
  detail?: { message?: string };
};

type PublisherJson = {
  name?: string;
};

type ChapterJson = {
  id: number;
  chapter?: number;
  tome?: number;
  name?: string;
  upload_date?: string;
  is_paid?: boolean;
  is_bought?: boolean;
  publishers?: PublisherJson[];
};

type PageJson = {
  link: string;
};

type DictionaryJson = {
  id: number;
  name: string;
};

/** Type/status/translate_status/age_limit are small, closed enumerations the site itself never
 *  changes without a redesign — verified live against api.remanga.org's own catalog SSR payload
 *  (`filtersOptions`), same way STATES above was derived. Genres/categories are the only groups
 *  fetched live, since those grow over time. */
const TYPE_OPTIONS: RawFilterOption[] = [
  { key: '1', title: 'Манга', count: null },
  { key: '2', title: 'Манхва', count: null },
  { key: '3', title: 'Маньхуа', count: null },
  { key: '4', title: 'Западный комикс', count: null },
  { key: '5', title: 'Рукомикс', count: null },
  { key: '6', title: 'Индонезийский комикс', count: null },
  { key: '7', title: 'Другое', count: null },
  { key: '22', title: 'Оригиналы', count: null },
];

/** `type.id` on the manga/list JSON — same ids as TYPE_OPTIONS above. Only the unambiguous ones
 *  get their own case; the rest (Рукомикс, Индонезийский комикс, Другое, Оригиналы) fall to OTHER. */
const mangaTypeById = (id: number | undefined): RawMangaType | null => {
  switch (id) {
    case 1:
      return MANGA_TYPE.MANGA;
    case 2:
      return MANGA_TYPE.MANHWA;
    case 3:
      return MANGA_TYPE.MANHUA;
    case 4:
      return MANGA_TYPE.COMICS;
    case undefined:
      return null;
    default:
      return MANGA_TYPE.OTHER;
  }
};

const STATUS_OPTIONS: RawFilterOption[] = [
  { key: '5', title: 'Анонс', count: null },
  { key: '1', title: 'Закончен', count: null },
  { key: '3', title: 'Заморожен', count: null },
  { key: '6', title: 'Лицензировано', count: null },
  { key: '2', title: 'Продолжается', count: null },
];

const TRANSLATE_STATUS_OPTIONS: RawFilterOption[] = [
  { key: '1', title: 'Закончен', count: null },
  { key: '3', title: 'Заморожен', count: null },
  { key: '5', title: 'Не переводится (лицензировано)', count: null },
  { key: '4', title: 'Нет переводчика', count: null },
  { key: '2', title: 'Продолжается', count: null },
];

const AGE_LIMIT_OPTIONS: RawFilterOption[] = [
  { key: '0', title: 'Для всех', count: null },
  { key: '1', title: '16+', count: null },
  { key: '2', title: '18+', count: null },
];

const getSortField = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.ADDED:
      return 'id';
    case SORT_ORDER.CHAPTERS:
      return 'count_chapters';
    case SORT_ORDER.POPULARITY:
      return 'score';
    case SORT_ORDER.RATING:
      return 'rating';
    case SORT_ORDER.RATING_COUNT:
      return 'count_rating';
    case SORT_ORDER.LIKES:
      return 'votes';
    case SORT_ORDER.VIEWS:
      return 'views';
    default:
      return 'chapter_date';
  }
};

// Django-filter's ordering convention: a bare field name sorts ascending, a `-` prefix descending.
const getSortKey = (order: string | undefined, direction: string | undefined): string => {
  const field = getSortField(order);
  return direction === SORT_DIRECTION.ASC ? field : `-${field}`;
};

const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createRemangaParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const apiHost = `api.${domain}`;

  // The upstream API rate-limits aggressively; the Kotlin fork retries once after a short
  // delay instead of surfacing a hard failure for a single transient 429.
  ctx.http.use(async (req, next) => {
    const res = await next(req);
    if (res.status === 429) {
      await sleep(1000);
      return next(req);
    }
    return res;
  });

  const parseTags = (genres: TagJson[] | undefined): RawTag[] => {
    return (genres ?? []).map((g) => ({
      title: toTitleCase(g.name),
      key: String(g.id),
      source: SOURCE_ID,
    }));
  };

  const parseManga = (jo: MangaJson): RawManga => {
    const url = `/manga/${jo.dir}`;
    const cover = jo.cover;
    return {
      id: generateUid(SOURCE_ID, url),
      title: jo.main_name,
      altTitles: jo.secondary_name ? [jo.secondary_name] : [],
      url,
      publicUrl: `https://${domain}${url}/main`,
      rating: jo.avg_rating != null ? jo.avg_rating / 10 : RATING_UNKNOWN,
      contentRating: null,
      coverUrl: cover.mid ? toAbsoluteUrl(cover.mid, apiHost) : null,
      largeCoverUrl: cover.high ? toAbsoluteUrl(cover.high, apiHost) : null,
      tags: parseTags(jo.genres),
      releaseState: jo.status?.id != null ? (STATES[jo.status.id] ?? null) : null,
      restriction: jo.status?.id === LICENSED_STATUS_ID ? MANGA_RESTRICTION.LEGAL : null,
      type: mangaTypeById(jo.type?.id),
      year: jo.issue_year ?? null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  /**
   * genre/category/type are the only groups the API lets you exclude — verified live against
   * api.remanga.org (`exclude_genres`/`exclude_categories`/`exclude_types`, each a repeated bare
   * `key=id` param, same shape as the plain include side). status/age_limit/translate_status have
   * no exclude counterpart. rating/issue_year/count_chapters are RANGE groups bounded through
   * Django-filter's own `_gte`/`_lte` suffix convention rather than a single combined param.
   */
  const applyFilterParams = (url: URL, filters: FilterSelection[] | undefined): void => {
    if (!filters || filters.length === 0) return;
    for (const filter of filters) {
      if ('range' in filter) {
        const param =
          filter.groupId === REMANGA_FILTER_GROUP.YEAR
            ? 'issue_year'
            : filter.groupId === REMANGA_FILTER_GROUP.CHAPTERS_COUNT
              ? 'count_chapters'
              : filter.groupId;
        if (filter.range.min != null)
          url.searchParams.set(`${param}_gte`, String(filter.range.min));
        if (filter.range.max != null)
          url.searchParams.set(`${param}_lte`, String(filter.range.max));
        continue;
      }
      switch (filter.groupId) {
        case REMANGA_FILTER_GROUP.GENRE:
          url.searchParams.append(filter.exclude ? 'exclude_genres' : 'genres', filter.key);
          break;
        case REMANGA_FILTER_GROUP.CATEGORY:
          url.searchParams.append(filter.exclude ? 'exclude_categories' : 'categories', filter.key);
          break;
        case REMANGA_FILTER_GROUP.TYPE:
          url.searchParams.append(filter.exclude ? 'exclude_types' : 'types', filter.key);
          break;
        case REMANGA_FILTER_GROUP.STATUS:
          url.searchParams.append('status', filter.key);
          break;
        case REMANGA_FILTER_GROUP.AGE_RATING:
          url.searchParams.append('age_limit', filter.key);
          break;
        case REMANGA_FILTER_GROUP.TRANSLATE_STATUS:
          url.searchParams.append('translate_status', filter.key);
          break;
      }
    }
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    direction: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawManga[]> => {
    const path = query ? '/api/v2/search' : '/api/v2/search/catalog';
    const url = new URL(`https://${apiHost}${path}`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('count', String(PAGE_SIZE));
    url.searchParams.set('ordering', getSortKey(order, direction));
    if (query) url.searchParams.set('query', query);
    applyFilterParams(url, filters);

    const json = await ctx.http.getJson<{ results: MangaJson[] }>(url.toString());
    return json.results.map(parseManga);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.direction, params.query, params.filters),
    );
  };

  const fetchDictionary = async (name: 'genres' | 'categories'): Promise<RawFilterOption[]> => {
    const json = await ctx.http.getJson<DictionaryJson[]>(
      `https://${apiHost}/api/v2/titles/${name}/`,
    );
    return json.map((jo) => ({ key: String(jo.id), title: jo.name, count: null }));
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const [genres, categories] = await Promise.all([
      fetchDictionary('genres'),
      fetchDictionary('categories'),
    ]);
    const currentYear = new Date().getFullYear();

    return [
      {
        id: REMANGA_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres,
      },
      {
        id: REMANGA_FILTER_GROUP.CATEGORY,
        title: 'Категории',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: categories,
      },
      {
        id: REMANGA_FILTER_GROUP.TYPE,
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: TYPE_OPTIONS,
      },
      {
        id: REMANGA_FILTER_GROUP.STATUS,
        title: 'Статус',
        type: FILTER_TYPE.CHECKBOX,
        options: STATUS_OPTIONS,
      },
      {
        id: REMANGA_FILTER_GROUP.TRANSLATE_STATUS,
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX,
        options: TRANSLATE_STATUS_OPTIONS,
      },
      {
        id: REMANGA_FILTER_GROUP.AGE_RATING,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: AGE_LIMIT_OPTIONS,
      },
      {
        id: REMANGA_FILTER_GROUP.RATING,
        title: 'Рейтинг',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 10, step: 0.1 }, presets: RATING_PRESETS },
      },
      {
        id: REMANGA_FILTER_GROUP.YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: YEAR_RANGE_MIN, max: currentYear, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(YEAR_RANGE_MIN, currentYear, YEAR_RANGE_CUTOFF),
        },
      },
      {
        id: REMANGA_FILTER_GROUP.CHAPTERS_COUNT,
        title: 'Количество глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 2000 }, presets: CHAPTERS_COUNT_PRESETS },
      },
    ];
  };

  const slugFromUrl = (mangaUrl: string): string => {
    const trimmed = mangaUrl.replace(/\/$/, '');
    return trimmed.split('/').pop() ?? trimmed;
  };

  const fetchAllChapters = async (branchId: number): Promise<ChapterJson[]> => {
    const result: ChapterJson[] = [];
    for (let page = 1; ; page += 1) {
      const url = `https://${apiHost}/api/v2/titles/chapters/?branch_id=${branchId}&page=${page}&count=500`;
      const json = await ctx.http.getJson<{ results: ChapterJson[] }>(url);
      if (json.results.length === 0) break;
      result.push(...json.results);
    }
    return result;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const slug = slugFromUrl(mangaUrl);
    const json = await ctx.http.getJson<MangaJson>(`https://${apiHost}/api/v2/titles/${slug}/`);

    const url = `/manga/${json.dir}`;
    const cover = json.cover;
    const altTitles = [
      ...(json.another_name?.split(' / ').map((s) => s.trim()) ?? []),
      ...(json.secondary_name ? [json.secondary_name] : []),
    ].filter((t) => t.length > 0);

    const chapters: RawChapter[] = [];
    let hadPaidChapters = false;
    for (const branch of json.branches ?? []) {
      const branchName = branch.publishers?.name ?? null;
      const branchChapters = (await fetchAllChapters(branch.id)).slice().reverse();
      for (const cjo of branchChapters) {
        if (cjo.is_paid && !cjo.is_bought) {
          hadPaidChapters = true;
          continue;
        }
        chapters.push({
          id: generateUid(SOURCE_ID, cjo.id),
          title: cjo.name ? toTitleCase(cjo.name) : null,
          number: cjo.chapter ?? 0,
          volume: cjo.tome ?? 0,
          url: `/api/v2/titles/chapters/${cjo.id}/`,
          scanlator: cjo.publishers?.[0]?.name ?? null,
          uploadDate: parseIsoDate(cjo.upload_date),
          branch: branchName,
          source: SOURCE_ID,
        });
      }
    }

    return {
      id: generateUid(SOURCE_ID, url),
      title: json.main_name,
      altTitles,
      url,
      publicUrl: `https://${domain}${url}/main`,
      rating: json.avg_rating != null ? json.avg_rating / 10 : RATING_UNKNOWN,
      contentRating:
        json.age_limit?.id === 0
          ? CONTENT_RATING.SAFE
          : json.age_limit?.id === 1 || json.age_limit?.id === 2
            ? CONTENT_RATING.SUGGESTIVE
            : null,
      coverUrl: cover.mid ? toAbsoluteUrl(cover.mid, apiHost) : null,
      largeCoverUrl: cover.high ? toAbsoluteUrl(cover.high, apiHost) : null,
      tags: parseTags(json.genres),
      releaseState: json.status?.id != null ? (STATES[json.status.id] ?? null) : null,
      restriction:
        json.status?.id === LICENSED_STATUS_ID
          ? MANGA_RESTRICTION.LEGAL
          : chapters.length === 0 && hadPaidChapters
            ? MANGA_RESTRICTION.PAYWALL
            : null,
      type: mangaTypeById(json.type?.id),
      year: json.issue_year ?? null,
      authors: [],
      description: json.description ?? null,
      chapters,
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const url = toAbsoluteUrl(chapterUrl, apiHost);
    const json = await ctx.http.getJson<{ pages?: (PageJson | PageJson[])[]; pub_date?: string }>(
      url,
    );
    if (!json.pages) {
      throw new NotFoundError(`Chapter is not available yet: ${url}`, SOURCE_ID);
    }
    const result: RawPage[] = [];
    for (const item of json.pages) {
      const entries = Array.isArray(item) ? item : [item];
      for (const page of entries) {
        result.push({
          id: generateUid(SOURCE_ID, page.link),
          url: toAbsoluteUrl(page.link, apiHost),
          preview: null,
          source: SOURCE_ID,
        });
      }
    }
    return result;
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Реманга',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.RATING,
        SORT_ORDER.VIEWS,
        SORT_ORDER.CHAPTERS,
        SORT_ORDER.ADDED,
        SORT_ORDER.UPDATED,
        SORT_ORDER.RATING_COUNT,
        SORT_ORDER.LIKES,
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
  };
};

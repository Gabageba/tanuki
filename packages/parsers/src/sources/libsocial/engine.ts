import { join } from 'node:path';
import { RAW_MANGA_STATE } from '../../types';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_STATE,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  formatCompactNumber,
  type FilterRangePreset,
} from '@tanuki/contracts';
import type { MangaState } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type {
  RawManga,
  RawChapter,
  RawPage,
  RawTag,
  RawFilterGroup,
  RawFilterOption,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { concatUrl } from '../../core/html/urls';
import { NotFoundError, SourceAuthRequiredError } from '../../errors';
import { catalogEntryFor } from '../catalog';
import type { LibSocialConfig } from './config';
import { LIBSOCIAL_API_HOST } from './config';
import { getValidAccessToken } from './auth';

const PAGE_SIZE = 60;

const STATES: Record<number, RawManga['state']> = {
  1: RAW_MANGA_STATE.ONGOING,
  2: RAW_MANGA_STATE.FINISHED,
  3: RAW_MANGA_STATE.UPCOMING,
  4: RAW_MANGA_STATE.PAUSED,
  5: RAW_MANGA_STATE.ABANDONED,
};

/** `status[]` filter values — same ids as STATES above, kept as a separate ordered list since
 *  the API exposes no endpoint to fetch these labels (unlike genres/tags). */
const STATUS_IDS: readonly (readonly [string, MangaState])[] = [
  ['1', MANGA_STATE.ONGOING],
  ['2', MANGA_STATE.FINISHED],
  ['3', MANGA_STATE.UPCOMING],
  ['4', MANGA_STATE.PAUSED],
  ['5', MANGA_STATE.ABANDONED],
];

const getStatusTitle = (state: MangaState): string => {
  switch (state) {
    case MANGA_STATE.ONGOING:
      return 'Онгоинг';
    case MANGA_STATE.FINISHED:
      return 'Завершён';
    case MANGA_STATE.UPCOMING:
      return 'Анонс';
    case MANGA_STATE.PAUSED:
      return 'Приостановлен';
    case MANGA_STATE.ABANDONED:
      return 'Заброшен';
  }
};

const DECADE_SIZE = 10;
const YEAR_RANGE_MIN = 1900;
const YEAR_RANGE_CUTOFF = 2000;

const RATING_PRESETS: FilterRangePreset[] = [
  { id: '9-plus', label: '9+', min: 9 },
  { id: '8-plus', label: '8+', min: 8 },
  { id: '7-plus', label: '7+', min: 7 },
];

const CHAPTERS_COUNT_PRESETS: FilterRangePreset[] = [
  { id: 'lt-20', label: '< 20', max: 20 },
  { id: 'lt-50', label: '< 50', max: 50 },
  { id: '100-200', label: '100-200', min: 100, max: 200 },
  { id: '200-300', label: '200-300', min: 200, max: 300 },
  { id: '300-plus', label: '300+', min: 300 },
];

const VOTES_COUNT_PRESETS: FilterRangePreset[] = [
  { id: 'lt-100', label: '< 100', max: 100 },
  { id: '100-1000', label: `100-${formatCompactNumber(1000)}`, min: 100, max: 1000 },
  {
    id: '1000-5000',
    label: `${formatCompactNumber(1000)}-${formatCompactNumber(5000)}`,
    min: 1000,
    max: 5000,
  },
  {
    id: '5000-10000',
    label: `${formatCompactNumber(5000)}-${formatCompactNumber(10000)}`,
    min: 5000,
    max: 10000,
  },
  { id: '10000-plus', label: `${formatCompactNumber(10000)}+`, min: 10000 },
];

/** "Текущий год", the current-decade-so-far, a preset per full decade back to `YEAR_RANGE_CUTOFF`,
 *  then one trailing preset lumping everything older than that into "Раньше 2000". */
const getYearRangePresets = (maxYear: number): FilterRangePreset[] => {
  const presets: FilterRangePreset[] = [
    { id: 'current-year', label: 'Текущий год', min: maxYear, max: maxYear },
  ];
  const currentDecadeStart = Math.floor(maxYear / DECADE_SIZE) * DECADE_SIZE;
  if (currentDecadeStart < maxYear) {
    presets.push({
      id: `decade-${currentDecadeStart}`,
      label: `${currentDecadeStart}–${maxYear}`,
      min: currentDecadeStart,
      max: maxYear,
    });
  }
  for (
    let decadeStart = currentDecadeStart - DECADE_SIZE;
    decadeStart >= YEAR_RANGE_CUTOFF;
    decadeStart -= DECADE_SIZE
  ) {
    presets.push({
      id: `decade-${decadeStart}`,
      label: `${decadeStart}-е`,
      min: decadeStart,
      max: decadeStart + DECADE_SIZE - 1,
    });
  }
  presets.push({
    id: `before-${YEAR_RANGE_CUTOFF}`,
    label: `Раньше ${YEAR_RANGE_CUTOFF}`,
    min: YEAR_RANGE_MIN,
    max: YEAR_RANGE_CUTOFF - 1,
  });
  return presets;
};

const SERVER_MAIN = 'main';
const SERVER_SECONDARY = 'secondary';
const SERVER_COMPRESS = 'compress';
const SERVER_DOWNLOAD = 'download';

type CoverJson = {
  default: string;
};

type RatingJson = {
  average?: number;
};

type StatusJson = {
  id?: number;
};

type AgeRestrictionJson = {
  id?: number;
};

type MangaListItemJson = {
  id: number;
  name: string;
  rus_name?: string;
  slug_url: string;
  cover: CoverJson;
  rating?: RatingJson;
  status?: StatusJson;
};

type TagJson = {
  id: number;
  name: string;
};

/** `/api/genres` and `/api/tags` — shared across the whole LibSocial network, so each entry
 *  carries every member site's id and must be filtered down to `cfg.siteId`. */
type FilterTagJson = {
  id: number;
  name: string;
  site_ids: number[];
};

/** Shape shared by the `types`, `scanlateStatus` and `ageRestriction` constants lists. */
type FilterLabelJson = {
  id: number;
  label: string;
  site_ids: number[];
};

type FilterFormatJson = {
  id: number;
  name: string;
  site_ids: number[];
};

type AuthorJson = {
  name?: string;
};

type MangaDetailsJson = {
  id: number;
  name: string;
  rus_name?: string;
  cover: CoverJson;
  genres: TagJson[];
  tags: TagJson[];
  authors: AuthorJson[];
  summary?: unknown;
  close_view?: number;
  rating?: RatingJson;
  status?: StatusJson;
  ageRestriction?: AgeRestrictionJson;
};

type BranchJson = {
  id: number;
  branch_id?: number;
  teams?: AuthorJson[];
  restricted_view?: { is_open?: boolean };
  created_at?: string;
};

type ChapterJson = {
  // The API sends these as JSON numbers most of the time, but switches to strings for some
  // manga (observed live on HENTAILIB) — coerce defensively rather than trusting the type.
  volume?: number | string;
  number?: number | string;
  name?: string | null;
  branches: BranchJson[];
};

type ImageServerJson = {
  id: string;
  url: string;
  site_ids: number[];
};

/**
 * MangaLib's "summary" field switched from a plain string to a TipTap/ProseMirror rich-text
 * doc (`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}`).
 * Flatten back to plain text, paragraphs joined by blank lines (matches Desu's convention —
 * see test/desu.test.ts — rather than the Kotlin fork's `nl2br()`, since there's no HTML
 * wrapping convention elsewhere in this package's `description` field).
 */
const summaryText = (summary: unknown): string => {
  if (typeof summary === 'string') return summary;
  if (!summary || typeof summary !== 'object') return '';
  const paragraphs: string[] = [];
  let current = '';
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as { type?: string; text?: string; content?: unknown[] };
    if (obj.type === 'text' && typeof obj.text === 'string') {
      current += obj.text;
      return;
    }
    obj.content?.forEach(walk);
    if (obj.type === 'paragraph') {
      paragraphs.push(current);
      current = '';
    }
  };
  walk(summary);
  return paragraphs.filter((p) => p.length > 0).join('\n\n');
};

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseRating = (rating: RatingJson | undefined): number => {
  return rating?.average != null ? rating.average / 10 : RATING_UNKNOWN;
};

/** MANGALIB's own "Популярность" is the API's default ranking (no sort_by at all, only
 *  sort_type) — it is not the same thing as sorting by views, confirmed against the live
 *  filter menu (9 options: Популярность, Рейтинг, Имя (A-Z), Имя (А-Я), Просмотры, Дата
 *  релиза, Дате добавления, Дате обновления, Кол-во глав). POPULARITY must fall through to
 *  `null` here rather than reusing 'views'.
 *
 *  The two "Имя" options aren't asc/desc of the same field — "Имя (A-Z)" sorts the Latin
 *  `name`, "Имя (А-Я)" sorts the Cyrillic `rus_name`, both ascending — hence ALPHABETICAL_EN /
 *  ALPHABETICAL_RU rather than ALPHABETICAL / ALPHABETICAL_DESC. */
const getSortBy = (order: string | undefined): string | null => {
  switch (order) {
    case SORT_ORDER.UPDATED:
      return 'last_chapter_at';
    case SORT_ORDER.ADDED:
      return 'created_at';
    case SORT_ORDER.NEWEST:
      return 'releaseDate';
    case SORT_ORDER.RATING:
      return 'rate_avg';
    case SORT_ORDER.CHAPTERS:
      return 'chap_count';
    case SORT_ORDER.VIEWS:
      return 'views';
    case SORT_ORDER.ALPHABETICAL_EN:
      return 'name';
    case SORT_ORDER.ALPHABETICAL_RU:
      return 'rus_name';
    default:
      return null;
  }
};

const getSortType = (order: string | undefined): string | null => {
  switch (order) {
    case SORT_ORDER.UPDATED:
    case SORT_ORDER.NEWEST:
    case SORT_ORDER.POPULARITY:
    case SORT_ORDER.RATING:
    case SORT_ORDER.CHAPTERS:
    case SORT_ORDER.VIEWS:
    case SORT_ORDER.ALPHABETICAL_EN:
    case SORT_ORDER.ALPHABETICAL_RU:
      return 'desc';
    default:
      return null;
  }
};

export const createLibSocialParser = (cfg: LibSocialConfig, ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let imageServersPromise: Promise<Map<string, string>> | null = null;

  ctx.http.use((req, next) =>
    next({ ...req, headers: { ...req.headers, 'Site-Id': String(cfg.siteId) } }),
  );

  const tokenStoreDir = ctx.credentials.libsocial?.tokenStoreDir;
  const tokenStorePath = tokenStoreDir ? join(tokenStoreDir, `${cfg.id}.json`) : undefined;
  if (cfg.auth && tokenStorePath) {
    const auth = cfg.auth;
    ctx.http.use(async (req, next) => {
      const token = await getValidAccessToken(auth, cfg.siteId, tokenStorePath, cfg.id, ctx.logger);
      return next({ ...req, headers: { ...req.headers, Authorization: `Bearer ${token}` } });
    });
  }

  const parseManga = (jo: MangaListItemJson): RawManga => {
    const title = jo.rus_name && jo.rus_name.length > 0 ? jo.rus_name : jo.name;
    return {
      id: generateUid(cfg.id, jo.id),
      title,
      altTitles: [jo.name],
      url: jo.slug_url,
      publicUrl: `https://${domain}/ru/manga/${jo.slug_url}`,
      rating: parseRating(jo.rating),
      contentRating: cfg.isNsfw ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE,
      coverUrl: jo.cover.default,
      tags: [],
      state: jo.status?.id != null ? (STATES[jo.status.id] ?? null) : null,
      authors: [],
      largeCoverUrl: jo.cover.default,
      description: null,
      chapters: null,
      source: cfg.id,
    };
  };

  /**
   * genre/tag keys carry a 'g'/'t' prefix (see parseTag below) to tell the two vocabularies
   * apart in a flat FilterSelection — the API itself wants the bare numeric id, so it's dropped
   * here (mirrors the Kotlin fork's `tag.key.drop(1)`).
   */
  /** `<param>_min`/`<param>_max` pairs — confirmed live for all four (rating_min/max,
   *  year_min/max, chap_count_min/max, rate_min/max) by watching how sorted-ascending/descending
   *  list edges move under each bound. Either side is optional — filters.ts guarantees at least
   *  one is set. `rate` is the vote *count* behind the average — distinct from `rating`
   *  (rate_avg), which is the score itself. */
  const applyRangeParam = (
    url: URL,
    groupId: string,
    range: { min?: number; max?: number },
  ): void => {
    let param: string;
    switch (groupId) {
      case 'rating':
        param = 'rating';
        break;
      case 'year':
        param = 'year';
        break;
      case 'chaptersCount':
        param = 'chap_count';
        break;
      case 'votesCount':
        param = 'rate';
        break;
      default:
        return;
    }
    if (range.min !== undefined) url.searchParams.set(`${param}_min`, String(range.min));
    if (range.max !== undefined) url.searchParams.set(`${param}_max`, String(range.max));
  };

  const applyFilterParams = (url: URL, filters: FilterSelection[] | undefined): void => {
    if (!filters || filters.length === 0) return;
    for (const filter of filters) {
      if ('range' in filter) {
        applyRangeParam(url, filter.groupId, filter.range);
        continue;
      }
      switch (filter.groupId) {
        case 'genre':
          url.searchParams.append(
            filter.exclude ? 'genres_exclude[]' : 'genres[]',
            filter.key.slice(1),
          );
          break;
        case 'tag':
          url.searchParams.append(
            filter.exclude ? 'tags_exclude[]' : 'tags[]',
            filter.key.slice(1),
          );
          break;
        case 'status':
          url.searchParams.append('status[]', filter.key);
          break;
        case 'type':
          url.searchParams.append('types[]', filter.key);
          break;
        case 'format':
          url.searchParams.append(filter.exclude ? 'format_exclude[]' : 'format[]', filter.key);
          break;
        case 'translationStatus':
          url.searchParams.append('scanlate_status[]', filter.key);
          break;
        case 'ageRestriction':
          url.searchParams.append('caution[]', filter.key);
          break;
        case 'other':
          switch (filter.key) {
            case 'noTranslation':
              url.searchParams.set('long_no_translation', '1');
              break;
            case 'licensed':
              url.searchParams.set('licensed', filter.exclude ? '0' : '1');
              break;
          }
          break;
      }
    }
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawManga[]> => {
    const url = new URL(`https://${LIBSOCIAL_API_HOST}/api/manga`);
    url.searchParams.set('site_id[]', String(cfg.siteId));
    url.searchParams.append('fields[]', 'rate');
    url.searchParams.append('fields[]', 'rate_avg');
    url.searchParams.set('page', String(page));
    if (query) url.searchParams.set('q', query);
    const sortBy = getSortBy(order);
    if (sortBy) url.searchParams.set('sort_by', sortBy);
    const sortType = getSortType(order);
    if (sortType) url.searchParams.set('sort_type', sortType);
    applyFilterParams(url, filters);

    const json = await ctx.http.getJson<{ data: MangaListItemJson[] }>(url.toString());
    return json.data.map(parseManga);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    // The API's own default (no sort_by at all) ranks by popularity, not by what's fresh —
    // callers that don't care about order should still see recently-updated titles first.
    const order = params.order ?? SORT_ORDER.UPDATED;
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, order, params.query, params.filters),
    );
  };

  const fetchChapters = async (mangaUrl: string): Promise<RawChapter[]> => {
    const url = `https://${LIBSOCIAL_API_HOST}/api/manga/${mangaUrl}/chapters`;
    const json = await ctx.http.getJson<{ data: ChapterJson[] }>(url);
    const chapters: RawChapter[] = [];
    for (const jo of json.data) {
      const volume = toNumber(jo.volume);
      const number = toNumber(jo.number);
      for (const branch of jo.branches) {
        if (branch.restricted_view && branch.restricted_view.is_open === false) continue;
        const branchId = branch.branch_id ?? 0;
        const team = branch.teams?.[0]?.name ?? null;
        let chapterUrl = `${mangaUrl}/chapter?number=${number}&volume=${volume}`;
        if (branchId !== 0) chapterUrl += `&branch_id=${branchId}`;
        chapters.push({
          id: generateUid(cfg.id, branch.id),
          title: jo.name ?? null,
          number,
          volume,
          url: chapterUrl,
          scanlator: team,
          uploadDate: parseIsoDate(branch.created_at),
          branch: team,
          source: cfg.id,
        });
      }
    }
    return chapters;
  };

  const parseTag = (prefix: string, jo: TagJson): RawTag => {
    return { title: jo.name, key: `${prefix}${jo.id}`, source: cfg.id };
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const detailsUrl = new URL(`https://${LIBSOCIAL_API_HOST}/api/manga/${mangaUrl}`);
    // 'status' used to be a valid explicit field but api.cdnlibs.org now rejects it with a 422
    // ("Выбранное значение для fields.N ошибочно") — it's already present in the base response
    // without being requested, so it never needed to be in this list.
    for (const field of [
      'summary',
      'genres',
      'tags',
      'authors',
      'close_view',
      'rate',
      'rate_avg',
    ]) {
      detailsUrl.searchParams.append('fields[]', field);
    }

    const [detailsRes, chapters] = await Promise.all([
      ctx.http.getJson<{ data: MangaDetailsJson }>(detailsUrl.toString()),
      fetchChapters(mangaUrl),
    ]);
    const json = detailsRes.data;

    const genres = json.genres.map((jo) => parseTag('g', jo));
    const tags = json.tags.map((jo) => parseTag('t', jo));
    const seenTitles = new Set<string>();
    const allTags = [...genres, ...tags].filter((tag) => {
      if (seenTitles.has(tag.title)) return false;
      seenTitles.add(tag.title);
      return true;
    });
    const authors = json.authors.map((a) => a.name).filter((n): n is string => !!n);
    const isRestricted = (json.close_view ?? 0) > 0;
    const title = json.rus_name && json.rus_name.length > 0 ? json.rus_name : json.name;
    const ageRestrictionId = json.ageRestriction?.id;

    return {
      id: generateUid(cfg.id, json.id),
      title,
      altTitles: [json.name],
      url: mangaUrl,
      publicUrl: `https://${domain}/ru/manga/${mangaUrl}`,
      rating: parseRating(json.rating),
      contentRating:
        ageRestrictionId != null
          ? ageRestrictionId >= 4
            ? CONTENT_RATING.SUGGESTIVE
            : cfg.isNsfw
              ? CONTENT_RATING.ADULT
              : CONTENT_RATING.SAFE
          : cfg.isNsfw
            ? CONTENT_RATING.ADULT
            : CONTENT_RATING.SAFE,
      coverUrl: json.cover.default,
      tags: allTags,
      state:
        chapters.length === 0 && isRestricted
          ? RAW_MANGA_STATE.RESTRICTED
          : json.status?.id != null
            ? (STATES[json.status.id] ?? null)
            : null,
      authors,
      largeCoverUrl: json.cover.default,
      description: summaryText(json.summary) || null,
      chapters,
      source: cfg.id,
    };
  };

  const toFilterOptions = (items: FilterTagJson[], prefix: string): RawFilterOption[] => {
    return items
      .filter((jo) => jo.site_ids.includes(cfg.siteId))
      .map((jo) => ({ key: `${prefix}${jo.id}`, title: jo.name, count: null }));
  };

  const toLabelFilterOptions = (items: FilterLabelJson[]): RawFilterOption[] => {
    return items
      .filter((jo) => jo.site_ids.includes(cfg.siteId))
      .map((jo) => ({ key: String(jo.id), title: jo.label, count: null }));
  };

  const toFormatFilterOptions = (items: FilterFormatJson[]): RawFilterOption[] => {
    return items
      .filter((jo) => jo.site_ids.includes(cfg.siteId))
      .map((jo) => ({ key: String(jo.id), title: jo.name, count: null }));
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    filtersPromise ??= fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    // /api/genres and /api/tags 403 anonymously ("User is not logged in") — the same lists are
    // exposed without auth via /api/constants, like imageServers below, so that's the route used.
    const url = `https://${LIBSOCIAL_API_HOST}/api/constants?fields[]=genres&fields[]=tags&fields[]=types&fields[]=format&fields[]=scanlateStatus&fields[]=ageRestriction`;
    const json = await ctx.http.getJson<{
      data: {
        genres: FilterTagJson[];
        tags: FilterTagJson[];
        types: FilterLabelJson[];
        format: FilterFormatJson[];
        scanlateStatus: FilterLabelJson[];
        ageRestriction: FilterLabelJson[];
      };
    }>(url);
    const genres = toFilterOptions(json.data.genres, 'g');
    const tags = toFilterOptions(json.data.tags, 't');
    const types = toLabelFilterOptions(json.data.types);
    const formats = toFormatFilterOptions(json.data.format);
    const translationStatuses = toLabelFilterOptions(json.data.scanlateStatus);
    const ageRestrictions = toLabelFilterOptions(json.data.ageRestriction);
    return [
      {
        id: 'type',
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX,
        options: types,
      },
      {
        id: 'genre',
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres,
      },
      {
        id: 'tag',
        title: 'Теги',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: tags,
      },
      {
        id: 'format',
        title: 'Формат выпуска',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: formats,
      },
      {
        id: 'translationStatus',
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX,
        options: translationStatuses,
      },
      {
        id: 'status',
        title: 'Статус тайтла',
        type: FILTER_TYPE.CHECKBOX,
        options: STATUS_IDS.map(([key, state]) => ({
          key,
          title: getStatusTitle(state),
          count: null,
        })),
      },
      {
        id: 'ageRestriction',
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: ageRestrictions,
      },
      {
        id: 'rating',
        title: 'Рейтинг',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 10 }, presets: RATING_PRESETS },
      },
      {
        id: 'votesCount',
        title: 'Количество оценок',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 100000 }, presets: VOTES_COUNT_PRESETS },
      },
      {
        id: 'year',
        title: 'Год релиза',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: YEAR_RANGE_MIN, max: new Date().getFullYear() },
          presets: getYearRangePresets(new Date().getFullYear()),
        },
      },
      {
        id: 'chaptersCount',
        title: 'Число глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: 10000 }, presets: CHAPTERS_COUNT_PRESETS },
      },
      {
        id: 'other',
        title: 'Другое',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        // The site itself mixes a plain toggle with an include/exclude one in this same group —
        // see FilterOption.excludable.
        options: [
          {
            key: 'noTranslation',
            title: 'Нет перевода уже 2 месяца',
            count: null,
            excludable: false,
          },
          { key: 'licensed', title: 'Издательский контент', count: null },
        ],
      },
    ];
  };

  const fetchImageServers = async (): Promise<Map<string, string>> => {
    const url = `https://${LIBSOCIAL_API_HOST}/api/constants?fields[]=imageServers`;
    const json = await ctx.http.getJson<{ data: { imageServers: ImageServerJson[] } }>(url);
    const result = new Map<string, string>();
    for (const server of json.data.imageServers) {
      if (server.site_ids.includes(cfg.siteId)) result.set(server.id, server.url);
    }
    return result;
  };

  const getImageServers = (): Promise<Map<string, string>> => {
    imageServersPromise ??= fetchImageServers();
    return imageServersPromise;
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const url = concatUrl(`https://${LIBSOCIAL_API_HOST}/api/manga/`, chapterUrl);
    let pagesJson: { data: { pages: { id: number; url: string }[] } };
    try {
      pagesJson = await ctx.http.getJson<{ data: { pages: { id: number; url: string }[] } }>(url);
    } catch (err) {
      if (cfg.authRequiredOnMissingPages && err instanceof NotFoundError) {
        throw new SourceAuthRequiredError('Pages require an authenticated session', cfg.id);
      }
      throw err;
    }
    const servers = await getImageServers();
    const primary =
      servers.get(SERVER_MAIN) ?? servers.get(SERVER_DOWNLOAD) ?? servers.get(SERVER_SECONDARY);
    if (!primary) throw new NotFoundError('No available image servers', cfg.id);
    const compress = servers.get(SERVER_COMPRESS);

    return pagesJson.data.pages.map((page) => {
      // The API hands back page.url as e.g. "//manga/adabana/chapters/.../001.png" — a leading
      // `//` makes URL resolution treat "manga" as the *host*, discarding the real image server
      // entirely (a scheme-relative reference, not the host-relative path it's meant to be).
      // Collapsing to a single leading slash is what actually resolves against `primary`.
      const path = page.url.replace(/^\/+/, '/');
      return {
        id: generateUid(cfg.id, page.id),
        url: concatUrl(primary, path),
        preview: compress ? concatUrl(compress, path) : null,
        source: cfg.id,
      };
    });
  };

  return {
    id: cfg.id,
    info: {
      id: cfg.id,
      title: catalogEntryFor(cfg.id).title,
      domain,
      locale: 'ru',
      contentType: cfg.isNsfw ? SOURCE_CONTENT_TYPE.hentai : SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      requiresVpn: catalogEntryFor(cfg.id).requiresVpn,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.RATING,
        SORT_ORDER.VIEWS,
        SORT_ORDER.CHAPTERS,
        SORT_ORDER.NEWEST,
        SORT_ORDER.UPDATED,
        SORT_ORDER.ADDED,
        SORT_ORDER.ALPHABETICAL_EN,
        SORT_ORDER.ALPHABETICAL_RU,
      ],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: true,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
    async init() {
      if (!cfg.auth) return;
      if (!tokenStorePath) {
        ctx.logger.warn(
          `${cfg.id}: no LIBSOCIAL_TOKEN_STORE_PATH configured — auth-gated pages will fail`,
        );
        return;
      }
      try {
        await getValidAccessToken(cfg.auth, cfg.siteId, tokenStorePath, cfg.id, ctx.logger);
      } catch (err) {
        ctx.logger.warn(
          `${cfg.id}: LibSocial token warmup failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  };
};

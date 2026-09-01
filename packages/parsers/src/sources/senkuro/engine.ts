import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_STATE,
  MANGA_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  type FilterRangePreset,
  type MangaState,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchCursorPaged } from '../../core/paging';
import type {
  RawManga,
  RawChapter,
  RawPage,
  RawTag,
  RawContentRating,
  RawFilterGroup,
  RawFilterOption,
  RawMangaType,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { ParseError, SourceUnavailableError } from '../../errors';
import { catalogEntryFor } from '../catalog';
import type { SenkuroConfig } from './config';

const URL_DELIMITER = ',,';
// Every domain a Senkuro-family source registers in ../catalog.ts is a mirror of the same
// frontend and reaches the same backend — the API host and the catalog-selecting app-id come
// from the config, not the domain.
const LIST_MAX_PAGE_SIZE = 100;

type LocalizedText = {
  lang?: string;
  content?: string;
};

type LocalizedDescription = {
  lang?: string;
  description?: string;
};

type CoverJson = {
  original?: { url?: string };
};

type LabelJson = {
  slug?: string;
  titles?: LocalizedText[];
};

type MangaCardJson = {
  id?: string;
  slug?: string;
  titles?: LocalizedText[];
  cover?: CoverJson;
  type?: string;
  releasedOn?: string;
  chapters?: number;
};

/** One entry of `allLabels(subjectType: MANGA)` — a flat list mixing category roots (`depth: 0`,
 *  `rootId` pointing at themselves) with their children (`depth > 0`, `rootId` pointing at the
 *  root). No separate "genre" concept exists server-side — genres live in here too, under the
 *  `themes` and `demographics` roots alongside tone/setting/cast labels. */
type AllLabelJson = {
  id?: string;
  slug?: string;
  rootId?: string;
  depth?: number;
  rating?: string;
  titles?: LocalizedText[];
};

type MangaInfoJson = MangaCardJson & {
  alternativeNames?: LocalizedText[];
  localizations?: LocalizedDescription[];
  status?: string;
  rating?: string;
  labels?: LabelJson[];
  mainStaff?: { person?: { name?: string } }[];
};

type ChapterJson = {
  id?: string;
  slug?: string;
  teamIds?: string[];
  number?: string;
  volume?: string;
  name?: string;
  createdAt?: string;
};

type TeamJson = {
  id?: string;
  name?: string;
};

const parseState = (raw: string | undefined): MangaState | null => {
  switch (raw?.toUpperCase()) {
    case 'FINISHED':
      return MANGA_STATE.FINISHED;
    case 'ONGOING':
      return MANGA_STATE.ONGOING;
    case 'HIATUS':
      return MANGA_STATE.PAUSED;
    case 'ANNOUNCE':
      return MANGA_STATE.UPCOMING;
    case 'CANCELLED':
      return MANGA_STATE.ABANDONED;
    default:
      return null;
  }
};

/** `type` on the manga list/details JSON — confirmed live against api.senkuro.com since
 *  introspection is disabled. OEL_MANGA and RU_MANGA fall to OTHER, same as remanga's
 *  mangaTypeById. */
const parseMangaType = (raw: string | undefined): RawMangaType | null => {
  switch (raw?.toUpperCase()) {
    case 'MANGA':
      return MANGA_TYPE.MANGA;
    case 'MANHWA':
      return MANGA_TYPE.MANHWA;
    case 'MANHUA':
      return MANGA_TYPE.MANHUA;
    case 'COMICS':
      return MANGA_TYPE.COMICS;
    case 'OEL_MANGA':
    case 'RU_MANGA':
      return MANGA_TYPE.OTHER;
    default:
      return null;
  }
};

/** `releasedOn` is a full `YYYY-MM-DD` date — confirmed live against api.senkuro.com. */
const parseYear = (raw: string | undefined): number | null => {
  const year = Number.parseInt(raw?.slice(0, 4) ?? '', 10);
  return Number.isNaN(year) ? null : year;
};

const parseContentRating = (raw: string | undefined): RawContentRating | null => {
  switch (raw?.toUpperCase()) {
    case 'EXPLICIT':
      return CONTENT_RATING.ADULT;
    case 'QUESTIONABLE':
    case 'SENSITIVE':
      return CONTENT_RATING.SUGGESTIVE;
    case 'GENERAL':
      return CONTENT_RATING.SAFE;
    default:
      return null;
  }
};

const pickLocalizedTitle = (items: LocalizedText[] | undefined): string | null => {
  if (!items || items.length === 0) return null;
  let first: string | null = null;
  let en: string | null = null;
  for (const item of items) {
    const text = item.content?.trim();
    if (!text) continue;
    first ??= text;
    const lang = item.lang?.toUpperCase();
    if (lang === 'RU') return text;
    if (lang === 'EN') en ??= text;
  }
  return en ?? first;
};

const parseLocalizationDescription = (items: LocalizedDescription[] | undefined): string | null => {
  if (!items || items.length === 0) return null;
  let first: string | null = null;
  for (const item of items) {
    const text = item.description?.trim();
    if (!text) continue;
    first ??= text;
    if (item.lang?.toUpperCase() === 'RU') return text;
  }
  return first;
};

const parseTitleList = (items: LocalizedText[] | undefined): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of items ?? []) {
    const text = item.content?.trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
  }
  return result;
};

const buildChapterTitle = (
  volume: string | undefined,
  number: string | undefined,
  name: string | undefined,
): string | null => {
  const parts: string[] = [];
  if (volume?.trim()) parts.push(`${volume.trim()}.`);
  if (number?.trim()) parts.push(`Глава ${number.trim()}`);
  let built = parts.join(' ');
  const title = name?.trim();
  if (title) built = built.length > 0 ? `${built} ${title}` : title;
  return built.length > 0 ? built : null;
};

const parseIsoDate = (raw: string | undefined): number => {
  const value = raw?.trim();
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Every enum below (values + their Russian labels) was pulled from senkuro.com's own catalog
// bundle the same way MangaOrder was — introspection is disabled, so this is transcribed from
// the compiled filter widget's option lists, not derived from the API.
const MANGA_TYPE_KEYS = ['MANGA', 'MANHWA', 'MANHUA', 'COMICS', 'OEL_MANGA', 'RU_MANGA'];
const getMangaTypeTitle = (key: string): string => {
  switch (key) {
    case 'MANGA':
      return 'Манга';
    case 'MANHWA':
      return 'Манхва';
    case 'MANHUA':
      return 'Маньхуа';
    case 'COMICS':
      return 'Комикс';
    case 'OEL_MANGA':
      return 'OEL Манга';
    case 'RU_MANGA':
      return 'РуМанга';
    default:
      return key;
  }
};

const MANGA_FORMAT_KEYS = [
  'DIGEST',
  'DOUJINSHI',
  'IN_COLOR',
  'SINGLE',
  'WEB',
  'WEBTOON',
  'YONKOMA',
  'SHORT',
];
const getMangaFormatTitle = (key: string): string => {
  switch (key) {
    case 'DIGEST':
      return 'Сборник';
    case 'DOUJINSHI':
      return 'Додзинси';
    case 'IN_COLOR':
      return 'В цвете';
    case 'SINGLE':
      return 'Сингл';
    case 'WEB':
      return 'Веб';
    case 'WEBTOON':
      return 'Вебтун';
    case 'YONKOMA':
      return 'Ёнкома';
    // The source's own catalog UI ships this one untranslated too.
    case 'SHORT':
      return 'Short';
    default:
      return key;
  }
};

const MANGA_FILTER_STATUS_KEYS = ['ANNOUNCE', 'ONGOING', 'FINISHED', 'HIATUS', 'CANCELLED'];
const getMangaFilterStatusTitle = (key: string): string => {
  switch (key) {
    case 'ANNOUNCE':
      return 'Анонс';
    case 'ONGOING':
      return 'Онгоинг';
    case 'FINISHED':
      return 'Выпущено';
    case 'HIATUS':
      return 'Приостановлено';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return key;
  }
};

const MANGA_FILTER_RATING_KEYS = ['GENERAL', 'SENSITIVE', 'QUESTIONABLE', 'EXPLICIT'];
const getMangaFilterRatingTitle = (key: string): string => {
  switch (key) {
    case 'GENERAL':
      return 'Безопасный';
    case 'SENSITIVE':
      return 'Сомнительный';
    case 'QUESTIONABLE':
      return 'Спорный';
    case 'EXPLICIT':
      return 'Откровенный';
    default:
      return key;
  }
};

const TRANSLITION_STATUS_KEYS = ['IN_PROGRESS', 'FINISHED', 'ABANDONED', 'FROZEN'];
const getTranslitionStatusTitle = (key: string): string => {
  switch (key) {
    case 'IN_PROGRESS':
      return 'Переводится';
    case 'FINISHED':
      return 'Завершён';
    case 'ABANDONED':
      return 'Заброшен';
    case 'FROZEN':
      return 'Заморожен';
    default:
      return key;
  }
};

const MANGA_SOURCE_KEYS = [
  'ORIGINAL',
  'MANGA',
  'LIGHT_NOVEL',
  'NOVEL',
  'WEB_NOVEL',
  'VISUAL_NOVEL',
  'VIDEO_GAME',
  'GAME',
  'ANIME',
  'LIVE_ACTION',
  'COMIC',
  'DOUJINSHI',
  'PICTURE_BOOK',
  'OTHER',
];
const getMangaSourceTitle = (key: string): string => {
  switch (key) {
    case 'ORIGINAL':
      return 'Оригинальная работа';
    case 'MANGA':
      return 'Манга';
    case 'LIGHT_NOVEL':
      return 'Ранобэ';
    case 'NOVEL':
      return 'Новелла';
    case 'WEB_NOVEL':
      return 'Веб-новелла';
    case 'VISUAL_NOVEL':
      return 'Визуальная новелла';
    case 'VIDEO_GAME':
      return 'Видео-игра';
    case 'GAME':
      return 'Игра';
    case 'ANIME':
      return 'Аниме';
    case 'LIVE_ACTION':
      return 'Лайв-экшн';
    case 'COMIC':
      return 'Комикс';
    case 'DOUJINSHI':
      return 'Додзинси';
    case 'PICTURE_BOOK':
      return 'Иллюстрированные книги';
    case 'OTHER':
      return 'Другое';
    default:
      return key;
  }
};

const toStaticOptions = (keys: string[], getTitle: (key: string) => string): RawFilterOption[] => {
  return keys.map((key) => ({ key, title: getTitle(key), count: null }));
};

const CHAPTERS_RANGE_MAX = 2000;
const CHAPTERS_COUNT_PRESETS: FilterRangePreset[] = [
  { id: 'lt-20', label: '< 20', max: 20 },
  { id: 'lt-50', label: '< 50', max: 50 },
  { id: '100-200', label: '100-200', min: 100, max: 200 },
  { id: '200-300', label: '200-300', min: 200, max: 300 },
  { id: '300-plus', label: '300+', min: 300 },
];

const YEAR_RANGE_MIN = 1970;
const YEAR_RANGE_DECADE_SIZE = 10;

/** "Текущий год", the current-decade-so-far, then a preset per full decade back to
 *  YEAR_RANGE_MIN — same shape as Inkstory's year presets. */
const getYearRangePresets = (minYear: number, maxYear: number): FilterRangePreset[] => {
  const presets: FilterRangePreset[] = [
    { id: 'current-year', label: 'Текущий год', min: maxYear, max: maxYear },
  ];
  const currentDecadeStart = Math.floor(maxYear / YEAR_RANGE_DECADE_SIZE) * YEAR_RANGE_DECADE_SIZE;
  if (currentDecadeStart < maxYear) {
    presets.push({
      id: `decade-${currentDecadeStart}`,
      label: `${currentDecadeStart}–${maxYear}`,
      min: currentDecadeStart,
      max: maxYear,
    });
  }
  for (
    let decadeStart = currentDecadeStart - YEAR_RANGE_DECADE_SIZE;
    decadeStart >= minYear;
    decadeStart -= YEAR_RANGE_DECADE_SIZE
  ) {
    presets.push({
      id: `decade-${decadeStart}`,
      label: `${decadeStart}-е`,
      min: decadeStart,
      max: decadeStart + YEAR_RANGE_DECADE_SIZE - 1,
    });
  }
  return presets;
};

type InclusionInput = { include: string[]; exclude: string[] };

/** Every *_Filter input on `mangas` shares this include/exclude shape — confirmed live against
 *  api.senkuro.com since introspection is disabled (see LIST_QUERY's own comment). */
const collectInclusion = (
  filters: FilterSelection[],
  matchesGroup: (groupId: string) => boolean,
): InclusionInput | undefined => {
  const include: string[] = [];
  const exclude: string[] = [];
  for (const filter of filters) {
    if ('range' in filter || !matchesGroup(filter.groupId)) continue;
    (filter.exclude ? exclude : include).push(filter.key);
  }
  return include.length > 0 || exclude.length > 0 ? { include, exclude } : undefined;
};

const findRange = (
  filters: FilterSelection[],
  groupId: string,
): { min?: number; max?: number } | undefined =>
  filters.find(
    (f): f is Extract<FilterSelection, { range: unknown }> => 'range' in f && f.groupId === groupId,
  )?.range;

/** Year -> the source's `YYYY-01-01` date bound for MangaReleasedOnFilter/MangaCompletedOnFilter. */
const yearToDateBound = (year: number | undefined): string | undefined =>
  year === undefined ? undefined : `${year}-01-01`;

/** Every getFilters() group whose selections all fold into the single `label` GraphQL argument —
 *  one group per `allLabels` root category (see fetchLabelGroups). */
const isLabelGroup = (groupId: string): boolean => groupId.startsWith('label-');

/** All filter-driven variables `mangas()` accepts beyond paging/search/order — omits a key
 *  entirely when nothing was selected for it rather than sending an empty filter object. */
const buildFilterVariables = (filters: FilterSelection[] | undefined): Record<string, unknown> => {
  if (!filters || filters.length === 0) return {};
  const variables: Record<string, unknown> = {};

  const label = collectInclusion(filters, isLabelGroup);
  if (label) variables['label'] = label;
  const type = collectInclusion(filters, (id) => id === 'type');
  if (type) variables['type'] = type;
  const format = collectInclusion(filters, (id) => id === 'format');
  if (format) variables['format'] = format;
  const status = collectInclusion(filters, (id) => id === 'status');
  if (status) variables['status'] = status;
  const rating = collectInclusion(filters, (id) => id === 'rating');
  if (rating) variables['rating'] = rating;
  const translitionStatus = collectInclusion(filters, (id) => id === 'translitionStatus');
  if (translitionStatus) variables['translitionStatus'] = translitionStatus;
  const source = collectInclusion(filters, (id) => id === 'source');
  if (source) variables['source'] = source;

  const chapters = findRange(filters, 'chapters');
  if (chapters) variables['chapters'] = { start: chapters.min, end: chapters.max };
  const releasedOn = findRange(filters, 'releasedOn');
  if (releasedOn) {
    variables['releasedOn'] = {
      start: yearToDateBound(releasedOn.min),
      end: yearToDateBound(releasedOn.max),
    };
  }
  const completedOn = findRange(filters, 'completedOn');
  if (completedOn) {
    variables['completedOn'] = {
      start: yearToDateBound(completedOn.min),
      end: yearToDateBound(completedOn.max),
    };
  }

  return variables;
};

export const createSenkuroParser = (cfg: SenkuroConfig, ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const SOURCE_ID = cfg.id;

  const postGraphQl = async (
    query: string,
    variables: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    const res = await ctx.http.request({
      method: 'POST',
      url: cfg.apiEndpoint,
      headers: {
        'Content-Type': 'application/json',
        // Selects which of the backend's catalogs to answer from — see ./config.ts. Without it
        // every source would serve Senkuro's catalog.
        'app-id': cfg.appId,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/`,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status >= 400) {
      throw new SourceUnavailableError(`Upstream HTTP ${res.status}`, SOURCE_ID);
    }
    const json = res.json<{ errors?: unknown[]; data?: Record<string, unknown> }>();
    if (json.errors && json.errors.length > 0) {
      throw new ParseError(JSON.stringify(json.errors), SOURCE_ID);
    }
    if (!json.data) throw new ParseError('GraphQL response has no data', SOURCE_ID);
    return json.data;
  };

  const parseMangaCard = (info: MangaCardJson | null | undefined): RawManga | null => {
    if (!info?.id || !info.slug) return null;
    const url = [info.id, info.slug].join(URL_DELIMITER);
    const title = pickLocalizedTitle(info.titles) ?? info.slug;
    const cover = info.cover?.original?.url ?? null;
    return {
      id: generateUid(SOURCE_ID, info.id),
      title,
      altTitles: [],
      url,
      publicUrl: `https://${domain}/manga/${info.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: null,
      coverUrl: cover,
      largeCoverUrl: cover,
      tags: [],
      state: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(info.type),
      year: parseYear(info.releasedOn),
      chaptersCount: info.chapters ?? null,
    };
  };

  // Extracted straight from senkuro.me's own catalog bundle (introspection is disabled, so
  // schema probing alone missed POPULARITY_SCORE — the frontend's browse page ships an embedded
  // enum: CHAPTERS, CREATED_AT, LAST_CHAPTER_AT, POPULARITY_SCORE, SCORE, VIEWS, all uppercase;
  // lowercase is rejected). `direction` is a required OrderDirection whenever a field is given.
  const mapOrderBy = (
    order: string | undefined,
    direction: string | undefined,
  ): { field: string; direction: string } => {
    let field: string;
    switch (order) {
      case SORT_ORDER.RATING:
        field = 'SCORE';
        break;
      case SORT_ORDER.CHAPTERS:
        field = 'CHAPTERS';
        break;
      case SORT_ORDER.VIEWS:
        field = 'VIEWS';
        break;
      case SORT_ORDER.ADDED:
        field = 'CREATED_AT';
        break;
      case SORT_ORDER.UPDATED:
        field = 'LAST_CHAPTER_AT';
        break;
      case SORT_ORDER.POPULARITY:
      default:
        field = 'POPULARITY_SCORE';
        break;
    }
    return { field, direction: direction === SORT_DIRECTION.ASC ? 'ASC' : 'DESC' };
  };

  const fetchListPage = async (
    cursor: string | null,
    first: number,
    order: string | undefined,
    direction: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<{ items: RawManga[]; nextCursor: string | null }> => {
    const variables: Record<string, unknown> = {
      after: cursor,
      first,
      orderBy: mapOrderBy(order, direction),
      ...buildFilterVariables(filters),
    };
    if (query?.trim()) variables['search'] = query.trim();

    const data = await postGraphQl(LIST_QUERY, variables);
    const payload = data['mangas'] as
      | {
          edges?: { node?: MangaCardJson }[];
          pageInfo?: { hasNextPage?: boolean; endCursor?: string };
        }
      | undefined;
    const items = (payload?.edges ?? [])
      .map((edge) => parseMangaCard(edge.node))
      .filter((m): m is RawManga => m !== null);
    const nextCursor = payload?.pageInfo?.hasNextPage ? (payload.pageInfo.endCursor ?? null) : null;
    return { items, nextCursor };
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchCursorPaged(params, { maxPageSize: LIST_MAX_PAGE_SIZE }, (cursor, first) =>
      fetchListPage(cursor, first, params.order, params.direction, params.query, params.filters),
    );
  };

  /**
   * `allLabels(subjectType: MANGA)` is one flat list of ~320 labels shared by both catalogs,
   * partitioned into 7 root categories (main_cast, hentai_themes, traits, setting, themes,
   * elements, demographics) — verified live. There's no separate "genre" endpoint: genres live
   * inside `themes`/`demographics` alongside tone and setting labels, same as the site's own
   * catalog page groups them. Every root becomes its own getFilters() group so the UI can show
   * them as separate sections, but all of them post back through the single `label` argument
   * (see isLabelGroup/buildFilterVariables) — the source itself has no per-root filter argument.
   */
  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchLabelGroups = async (): Promise<RawFilterGroup[]> => {
    const data = await postGraphQl(ALL_LABELS_QUERY, {});
    const labels = (data['allLabels'] as AllLabelJson[] | undefined) ?? [];
    const roots = new Map<string, AllLabelJson>();
    for (const label of labels) {
      if (label.depth === 0 && label.id) roots.set(label.id, label);
    }

    // SENKOGNITO is the 18+ catalog and keeps the explicit root; SENKURO's general catalog hides
    // it entirely, mirroring the site's own `website mode !== Senkognito` check.
    const isAdultSource = catalogEntryFor(SOURCE_ID).isAdult;

    const groups: RawFilterGroup[] = [];
    for (const root of roots.values()) {
      if (!isAdultSource && parseContentRating(root.rating) === CONTENT_RATING.ADULT) continue;
      const rootTitle = pickLocalizedTitle(root.titles);
      if (!root.id || !root.slug || !rootTitle) continue;

      const options: RawFilterOption[] = labels
        .filter((label) => label.rootId === root.id && label.depth !== 0)
        .map((label): RawFilterOption | null => {
          const title = pickLocalizedTitle(label.titles);
          if (!label.slug || !title) return null;
          return { key: label.slug, title, count: null };
        })
        .filter((o): o is RawFilterOption => o !== null);
      if (options.length === 0) continue;

      groups.push({
        id: `label-${root.slug}`,
        title: rootTitle,
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options,
      });
    }
    return groups;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const currentYear = new Date().getFullYear();
    const labelGroups = await fetchLabelGroups();
    return [
      ...labelGroups,
      {
        id: 'type',
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_TYPE_KEYS, getMangaTypeTitle),
      },
      {
        id: 'format',
        title: 'Формат',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_FORMAT_KEYS, getMangaFormatTitle),
      },
      {
        id: 'status',
        title: 'Статус тайтла',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_FILTER_STATUS_KEYS, getMangaFilterStatusTitle),
      },
      {
        id: 'rating',
        title: 'Возрастной рейтинг',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_FILTER_RATING_KEYS, getMangaFilterRatingTitle),
      },
      {
        id: 'translitionStatus',
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(TRANSLITION_STATUS_KEYS, getTranslitionStatusTitle),
      },
      {
        id: 'source',
        title: 'Первоисточник',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_SOURCE_KEYS, getMangaSourceTitle),
      },
      {
        id: 'chapters',
        title: 'Число глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: CHAPTERS_RANGE_MAX }, presets: CHAPTERS_COUNT_PRESETS },
      },
      {
        id: 'releasedOn',
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: YEAR_RANGE_MIN, max: currentYear, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(YEAR_RANGE_MIN, currentYear),
        },
      },
      {
        id: 'completedOn',
        title: 'Год завершения',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: YEAR_RANGE_MIN, max: currentYear, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(YEAR_RANGE_MIN, currentYear),
        },
      },
    ];
  };

  const parseMangaUrl = (url: string): { mangaId: string; mangaSlug: string } => {
    const [mangaId, mangaSlug] = url.split(URL_DELIMITER);
    if (!mangaId || !mangaSlug) throw new ParseError(`Cannot parse manga url: ${url}`, SOURCE_ID);
    return { mangaId, mangaSlug };
  };

  const parseMangaInfo = (info: MangaInfoJson): RawManga | null => {
    const title = pickLocalizedTitle(info.titles);
    if (!title || !info.id || !info.slug) return null;
    const url = [info.id, info.slug].join(URL_DELIMITER);
    const altTitles = parseTitleList(info.alternativeNames);
    const cover = info.cover?.original?.url ?? null;

    const descriptionParts: string[] = [];
    if (altTitles.length > 0) {
      descriptionParts.push(`Альтернативные названия:\n${altTitles.join(' / ')}`);
    }
    const ruDescription = parseLocalizationDescription(info.localizations);
    if (ruDescription) descriptionParts.push(ruDescription);

    const authors = [
      ...new Set(
        (info.mainStaff ?? [])
          .map((s) => s.person?.name?.trim())
          .filter((n): n is string => !!n && n.length > 0),
      ),
    ];

    const tags: RawTag[] = (info.labels ?? [])
      .map((label): RawTag | null => {
        const slug = label.slug;
        const labelTitle = pickLocalizedTitle(label.titles);
        if (!slug || !labelTitle) return null;
        return { key: slug, title: toTitleCase(labelTitle), source: SOURCE_ID };
      })
      .filter((t): t is RawTag => t !== null);

    return {
      id: generateUid(SOURCE_ID, info.id),
      title,
      altTitles,
      url,
      publicUrl: `https://${domain}/manga/${info.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: parseContentRating(info.rating),
      coverUrl: cover,
      largeCoverUrl: cover,
      tags,
      state: parseState(info.status),
      authors,
      description: descriptionParts.length > 0 ? descriptionParts.join('\n\n') : null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(info.type),
    };
  };

  const fetchChapters = async (mangaId: string, mangaSlug: string): Promise<RawChapter[]> => {
    const data = await postGraphQl(CHAPTERS_QUERY, { mangaId });
    const payload = data['mangaTachiyomiChapters'] as
      { chapters?: ChapterJson[]; teams?: TeamJson[] } | undefined;
    const teamsById = new Map<string, string>();
    for (const team of payload?.teams ?? []) {
      if (team.id && team.name) teamsById.set(team.id, team.name);
    }

    const chapters: RawChapter[] = (payload?.chapters ?? [])
      .map((ch): RawChapter | null => {
        if (!ch.id || !ch.slug) return null;
        const numberRaw = ch.number?.replace(',', '.');
        const number = numberRaw ? Number.parseFloat(numberRaw) || 0 : 0;
        const volume = ch.volume ? Number.parseInt(ch.volume, 10) || 0 : 0;
        const scanlator =
          [
            ...new Set(
              (ch.teamIds ?? []).map((id) => teamsById.get(id)).filter((n): n is string => !!n),
            ),
          ].join(', ') || null;
        const url = [mangaId, mangaSlug, ch.id, ch.slug].join(URL_DELIMITER);
        return {
          id: generateUid(SOURCE_ID, url),
          title: buildChapterTitle(ch.volume, ch.number, ch.name),
          number,
          volume,
          url,
          scanlator,
          uploadDate: parseIsoDate(ch.createdAt),
          branch: null,
          source: SOURCE_ID,
        };
      })
      .filter((c): c is RawChapter => c !== null);
    return chapters.reverse();
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const { mangaId, mangaSlug } = parseMangaUrl(mangaUrl);
    const [data, chapters] = await Promise.all([
      postGraphQl(DETAILS_QUERY, { mangaId }),
      fetchChapters(mangaId, mangaSlug),
    ]);
    const info = data['mangaTachiyomiInfo'] as MangaInfoJson | undefined;
    if (!info) throw new ParseError('Cannot parse manga details', SOURCE_ID);
    const manga = parseMangaInfo(info);
    if (!manga) throw new ParseError('Cannot parse manga details', SOURCE_ID);
    return { ...manga, chapters };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const parts = chapterUrl.split(URL_DELIMITER);
    const mangaId = parts[0];
    const chapterId = parts[2];
    if (!mangaId) throw new ParseError('Cannot parse manga id', SOURCE_ID);
    if (!chapterId) throw new ParseError('Cannot parse chapter id', SOURCE_ID);

    const data = await postGraphQl(CHAPTER_PAGES_QUERY, { mangaId, chapterId });
    const payload = data['mangaTachiyomiChapterPages'] as
      { pages?: { url?: string }[] } | undefined;
    return (payload?.pages ?? [])
      .map((p): RawPage | null => {
        if (!p.url) return null;
        const url = toAbsoluteUrl(p.url, domain);
        return { id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID };
      })
      .filter((p): p is RawPage => p !== null);
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: catalogEntryFor(SOURCE_ID).title,
      domain,
      locale: 'ru',
      contentType: catalogEntryFor(SOURCE_ID).contentType,
      isBroken: catalogEntryFor(SOURCE_ID).isBroken,
      isAdult: catalogEntryFor(SOURCE_ID).isAdult,
      requiresVpn: catalogEntryFor(SOURCE_ID).requiresVpn,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.RATING,
        SORT_ORDER.CHAPTERS,
        SORT_ORDER.VIEWS,
        SORT_ORDER.ADDED,
        SORT_ORDER.UPDATED,
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

// Every *_Filter argument here (type/format/status/source/rating/translitionStatus/label, plus
// the chapters/releasedOn/completedOn range inputs) was found the same way MangaOrder was —
// transcribed from senkuro.com's compiled catalog page (fetchMangas' own variable declarations),
// then verified live against api.senkuro.com since introspection is disabled.
const LIST_QUERY = `
query fetchMangas(
  $after: String,
  $first: Int,
  $search: String,
  $orderBy: MangaOrder,
  $type: MangaTypeFilter,
  $format: MangaFormatFilter,
  $status: MangaStatusFilter,
  $source: MangaSourceFilter,
  $rating: MangaRatingFilter,
  $translitionStatus: MangaTranslitionStatusFilter,
  $label: MangaLabelFilter,
  $chapters: MangaChaptersFilter,
  $releasedOn: MangaReleasedOnFilter,
  $completedOn: MangaCompletedOnFilter
) {
  mangas(
    after: $after,
    first: $first,
    search: $search,
    orderBy: $orderBy,
    type: $type,
    format: $format,
    status: $status,
    source: $source,
    rating: $rating,
    translitionStatus: $translitionStatus,
    label: $label,
    chapters: $chapters,
    releasedOn: $releasedOn,
    completedOn: $completedOn
  ) {
    edges {
      node {
        id
        slug
        titles {
          lang
          content
        }
        cover {
          original {
            url
          }
        }
        type
        releasedOn
        chapters
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

const DETAILS_QUERY = `
query fetchTachiyomiManga($mangaId: ID!) {
  mangaTachiyomiInfo(mangaId: $mangaId) {
    id
    slug
    titles {
      lang
      content
    }
    alternativeNames {
      lang
      content
    }
    localizations {
      lang
      description
    }
    type
    rating
    status
    formats
    labels {
      id
      rootId
      slug
      titles {
        lang
        content
      }
    }
    translationStatus
    cover {
      original {
        url
      }
    }
    mainStaff {
      roles
      person {
        name
      }
    }
  }
}
`;

const CHAPTERS_QUERY = `
query fetchTachiyomiChapters($mangaId: ID!) {
  mangaTachiyomiChapters(mangaId: $mangaId) {
    message
    chapters {
      id
      slug
      branchId
      name
      teamIds
      number
      volume
      createdAt
    }
    teams {
      id
      slug
      name
    }
  }
}
`;

const CHAPTER_PAGES_QUERY = `
query fetchTachiyomiChapterPages(
  $mangaId: ID!,
  $chapterId: ID!
) {
  mangaTachiyomiChapterPages(
    mangaId: $mangaId,
    chapterId: $chapterId
  ) {
    pages {
      url
    }
  }
}
`;

const ALL_LABELS_QUERY = `
query fetchMangaLabels {
  allLabels(subjectType: MANGA) {
    id
    slug
    rootId
    depth
    rating
    titles {
      lang
      content
    }
  }
}
`;

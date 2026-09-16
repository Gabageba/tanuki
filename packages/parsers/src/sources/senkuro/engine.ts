import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_STATE,
  MANGA_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  type MangaState,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchCursorPaged } from '../../core/paging';
import { CHAPTERS_COUNT_PRESETS, getYearRangePresets } from '../../core/filters/range-presets';
import { FILTER_GROUP } from '../../core/filters/group';
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

export const SENKURO_FILTER_GROUP = {
  TYPE: FILTER_GROUP.TYPE,
  FORMAT: FILTER_GROUP.FORMAT,
  STATUS: FILTER_GROUP.STATUS,
  RATING: FILTER_GROUP.RATING,
  TRANSLITION_STATUS: FILTER_GROUP.TRANSLITION_STATUS,
  SOURCE: FILTER_GROUP.SOURCE,
  CHAPTERS: FILTER_GROUP.CHAPTERS,
  RELEASED_ON: FILTER_GROUP.RELEASED_ON,
  COMPLETED_ON: FILTER_GROUP.COMPLETED_ON,
} as const;
const SENKURO_LABEL_GROUP_PREFIX = 'label-';

type LocalizedText = {
  lang?: string;
  content?: string;
};

/** A leaf/void node inside a `TiptapNodeNestedBlock.content` array — the description's rich-text
 *  schema exposes only `text` on text leaves and `type` on void nodes (`hardBreak`) through this
 *  API; every other node kind in the union (headings, lists, code blocks, mentions...) carries no
 *  extractable field at all, confirmed live against api.senkuro.com, so it's silently dropped. */
type TiptapInlineJson = {
  text?: string;
  type?: string;
};

/** One paragraph-like block of a rich-text description (`TiptapNodeNestedBlock`). Other top-level
 *  block kinds (`TiptapNodeCodeBlock` and friends) expose no `content` through this API and so
 *  contribute nothing. */
type TiptapBlockJson = {
  content?: TiptapInlineJson[];
};

type LocalizedRichDescription = {
  lang?: string;
  description?: TiptapBlockJson[];
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
  rating?: string;
  score?: number;
  status?: string;
  labels?: LabelJson[];
  localizations?: LocalizedRichDescription[];
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

type StaffJson = {
  roles?: string[];
  person?: { name?: string };
};

type StudioJson = {
  name?: string;
};

/** `manga(slug)` — a superset of `mangaTachiyomiInfo`'s stripped-down `MangaTachiyomi` type, the
 *  only place the extra fields below (views, originCountry, translitionStatus, publishers,
 *  releasedOn, createdAt) are exposed — confirmed live against api.senkuro.com since introspection
 *  is disabled. Its `localizations[].description` is rich text (`TiptapNodeUnion`), same shape as
 *  the list query's, unlike `MangaTachiyomi`'s plain-string one. */
type MangaInfoJson = {
  id?: string;
  slug?: string;
  titles?: LocalizedText[];
  alternativeNames?: LocalizedText[];
  localizations?: LocalizedRichDescription[];
  cover?: CoverJson;
  type?: string;
  score?: number;
  status?: string;
  rating?: string;
  formats?: string[];
  labels?: LabelJson[];
  mainStaff?: StaffJson[];
  releasedOn?: string;
  views?: number;
  originCountry?: string;
  translitionStatus?: string;
  createdAt?: string;
  publishers?: StudioJson[];
  scoreDistributions?: { count?: number }[];
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

/** `translitionStatus` on `manga(slug)` — the source's own typo, kept verbatim (see
 *  SENKURO_FILTER_GROUP.TRANSLITION_STATUS) — tracks Senkuro's own scanlation progress,
 *  distinct from `status`'s original-release state. */
const parseTranslationState = (raw: string | undefined): MangaState | null => {
  switch (raw?.toUpperCase()) {
    case 'FINISHED':
      return MANGA_STATE.FINISHED;
    case 'IN_PROGRESS':
      return MANGA_STATE.ONGOING;
    case 'FROZEN':
      return MANGA_STATE.PAUSED;
    case 'ABANDONED':
      return MANGA_STATE.ABANDONED;
    default:
      return null;
  }
};

/** `originCountry` is a free-form ISO-3166-1 alpha-2 code, not a closed enum the source declares
 *  (confirmed live: JP/KR/CN/RU/US/FR all appear across the catalog) — an unrecognized code falls
 *  back to itself rather than being dropped. */
const getOriginCountryTitle = (code: string): string => {
  switch (code) {
    case 'JP':
      return 'Япония';
    case 'KR':
      return 'Корея';
    case 'CN':
      return 'Китай';
    case 'RU':
      return 'Россия';
    case 'US':
      return 'США';
    case 'FR':
      return 'Франция';
    default:
      return code;
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

/** `score` is on a 0..10 scale (confirmed live, e.g. 9.78 for the top-rated title) — divided by
 *  10 to reach RawManga's 0..1 convention (see types.ts), same as libsocial's `rating.average`.
 *  An unrated title reports exactly `0`, which the API exposes no vote-count field to tell apart
 *  from a genuine bottom score, so it's folded into RATING_UNKNOWN same as everywhere else in
 *  this parser. */
const parseScore = (score: number | undefined): number =>
  score !== undefined && score > 0 ? score / 10 : RATING_UNKNOWN;

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

// Senkuro pads blank lines in its rich-text editor with a Hangul filler character rather than an
// empty paragraph — confirmed live — so it's stripped before a paragraph is judged empty.
const TIPTAP_FILLER_CHAR = 'ᅠ';

const extractTiptapPlainText = (blocks: TiptapBlockJson[] | undefined): string | null => {
  if (!blocks || blocks.length === 0) return null;
  const paragraphs: string[] = [];
  for (const block of blocks) {
    let text = '';
    for (const node of block.content ?? []) {
      if (node.text !== undefined) text += node.text;
      else if (node.type === 'hardBreak') text += '\n';
    }
    text = text.replaceAll(TIPTAP_FILLER_CHAR, '').trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs.length > 0 ? paragraphs.join('\n\n') : null;
};

const parseRichLocalizationDescription = (
  items: LocalizedRichDescription[] | undefined,
): string | null => {
  if (!items || items.length === 0) return null;
  let first: string | null = null;
  for (const item of items) {
    const text = extractTiptapPlainText(item.description);
    if (!text) continue;
    first ??= text;
    if (item.lang?.toUpperCase() === 'RU') return text;
  }
  return first;
};

const mapLabelsToTags = (labels: LabelJson[] | undefined, sourceId: string): RawTag[] =>
  (labels ?? [])
    .map((label): RawTag | null => {
      const slug = label.slug;
      const labelTitle = pickLocalizedTitle(label.titles);
      if (!slug || !labelTitle) return null;
      return { key: slug, title: toTitleCase(labelTitle), source: sourceId };
    })
    .filter((t): t is RawTag => t !== null);

/** `mainStaff[].roles` — confirmed live across ~1000 titles: only STORY, ART and STORY_AND_ART
 *  appear, so authors/artists split on membership rather than an exhaustive switch. */
const extractStaffNames = (
  mainStaff: StaffJson[] | undefined,
  matchesRole: (role: string) => boolean,
): string[] => [
  ...new Set(
    (mainStaff ?? [])
      .filter((staff) => (staff.roles ?? []).some(matchesRole))
      .map((staff) => staff.person?.name?.trim())
      .filter((n): n is string => !!n && n.length > 0),
  ),
];

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

const YEAR_RANGE_MIN = 1970;

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
const isLabelGroup = (groupId: string): boolean => groupId.startsWith(SENKURO_LABEL_GROUP_PREFIX);

/** All filter-driven variables `mangas()` accepts beyond paging/search/order — omits a key
 *  entirely when nothing was selected for it rather than sending an empty filter object. */
const buildFilterVariables = (filters: FilterSelection[] | undefined): Record<string, unknown> => {
  if (!filters || filters.length === 0) return {};
  const variables: Record<string, unknown> = {};

  const label = collectInclusion(filters, isLabelGroup);
  if (label) variables['label'] = label;
  const type = collectInclusion(filters, (id) => id === SENKURO_FILTER_GROUP.TYPE);
  if (type) variables['type'] = type;
  const format = collectInclusion(filters, (id) => id === SENKURO_FILTER_GROUP.FORMAT);
  if (format) variables['format'] = format;
  const status = collectInclusion(filters, (id) => id === SENKURO_FILTER_GROUP.STATUS);
  if (status) variables['status'] = status;
  const rating = collectInclusion(filters, (id) => id === SENKURO_FILTER_GROUP.RATING);
  if (rating) variables['rating'] = rating;
  const translitionStatus = collectInclusion(
    filters,
    (id) => id === SENKURO_FILTER_GROUP.TRANSLITION_STATUS,
  );
  if (translitionStatus) variables['translitionStatus'] = translitionStatus;
  const source = collectInclusion(filters, (id) => id === SENKURO_FILTER_GROUP.SOURCE);
  if (source) variables['source'] = source;

  const chapters = findRange(filters, SENKURO_FILTER_GROUP.CHAPTERS);
  if (chapters) variables['chapters'] = { start: chapters.min, end: chapters.max };
  const releasedOn = findRange(filters, SENKURO_FILTER_GROUP.RELEASED_ON);
  if (releasedOn) {
    variables['releasedOn'] = {
      start: yearToDateBound(releasedOn.min),
      end: yearToDateBound(releasedOn.max),
    };
  }
  const completedOn = findRange(filters, SENKURO_FILTER_GROUP.COMPLETED_ON);
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
      throw new SourceUnavailableError(
        `Upstream HTTP ${res.status}: ${cfg.apiEndpoint}`,
        SOURCE_ID,
      );
    }
    const json = res.json<{ errors?: unknown[]; data?: Record<string, unknown> }>();
    if (json.errors && json.errors.length > 0) {
      throw new ParseError(JSON.stringify(json.errors), SOURCE_ID);
    }
    if (!json.data) {
      throw new ParseError(`GraphQL response has no data: ${cfg.apiEndpoint}`, SOURCE_ID);
    }
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
      rating: parseScore(info.score),
      contentRating: parseContentRating(info.rating),
      coverUrl: cover,
      largeCoverUrl: cover,
      tags: mapLabelsToTags(info.labels, SOURCE_ID),
      releaseState: parseState(info.status),
      authors: [],
      description: parseRichLocalizationDescription(info.localizations),
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
        id: `${SENKURO_LABEL_GROUP_PREFIX}${root.slug}`,
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
        id: SENKURO_FILTER_GROUP.TYPE,
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_TYPE_KEYS, getMangaTypeTitle),
      },
      {
        id: SENKURO_FILTER_GROUP.FORMAT,
        title: 'Формат',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_FORMAT_KEYS, getMangaFormatTitle),
      },
      {
        id: SENKURO_FILTER_GROUP.STATUS,
        title: 'Статус тайтла',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_FILTER_STATUS_KEYS, getMangaFilterStatusTitle),
      },
      {
        id: SENKURO_FILTER_GROUP.RATING,
        title: 'Возрастной рейтинг',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_FILTER_RATING_KEYS, getMangaFilterRatingTitle),
      },
      {
        id: SENKURO_FILTER_GROUP.TRANSLITION_STATUS,
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(TRANSLITION_STATUS_KEYS, getTranslitionStatusTitle),
      },
      {
        id: SENKURO_FILTER_GROUP.SOURCE,
        title: 'Первоисточник',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: toStaticOptions(MANGA_SOURCE_KEYS, getMangaSourceTitle),
      },
      {
        id: SENKURO_FILTER_GROUP.CHAPTERS,
        title: 'Число глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: 0, max: CHAPTERS_RANGE_MAX }, presets: CHAPTERS_COUNT_PRESETS },
      },
      {
        id: SENKURO_FILTER_GROUP.RELEASED_ON,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: YEAR_RANGE_MIN, max: currentYear, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(YEAR_RANGE_MIN, currentYear),
        },
      },
      {
        id: SENKURO_FILTER_GROUP.COMPLETED_ON,
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

  const parseMangaInfo = (info: MangaInfoJson, translators: string[]): RawManga | null => {
    const title = pickLocalizedTitle(info.titles);
    if (!title || !info.id || !info.slug) return null;
    const url = [info.id, info.slug].join(URL_DELIMITER);
    const altTitles = parseTitleList(info.alternativeNames);
    const cover = info.cover?.original?.url ?? null;

    const authors = extractStaffNames(
      info.mainStaff,
      (role) => role === 'STORY' || role === 'STORY_AND_ART',
    );
    const artists = extractStaffNames(
      info.mainStaff,
      (role) => role === 'ART' || role === 'STORY_AND_ART',
    );
    const publishers = [
      ...new Set(
        (info.publishers ?? [])
          .map((p) => p.name?.trim())
          .filter((n): n is string => !!n && n.length > 0),
      ),
    ];

    const tags = mapLabelsToTags(info.labels, SOURCE_ID);

    // No direct votes-count field exists (confirmed live) — `score` is a bare average with no
    // count alongside it. The count only shows up as the per-bucket histogram the site sums into
    // its own JSON-LD `aggregateRating.ratingCount` (verified against senkuro.com's own markup),
    // so summing it here is the only way to reach the same number.
    const votesCount = (info.scoreDistributions ?? []).reduce(
      (sum, bucket) => sum + (bucket.count ?? 0),
      0,
    );

    return {
      id: generateUid(SOURCE_ID, info.id),
      title,
      altTitles,
      url,
      publicUrl: `https://${domain}/manga/${info.slug}`,
      rating: parseScore(info.score),
      contentRating: parseContentRating(info.rating),
      coverUrl: cover,
      largeCoverUrl: cover,
      tags,
      releaseState: parseState(info.status),
      authors,
      artists,
      publishers,
      translators,
      releaseFormats: (info.formats ?? []).map((f) => getMangaFormatTitle(f)),
      description: parseRichLocalizationDescription(info.localizations),
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(info.type),
      year: parseYear(info.releasedOn),
      releaseDate: parseIsoDate(info.releasedOn),
      addedAt: parseIsoDate(info.createdAt),
      views: info.views ?? null,
      votesCount: votesCount > 0 ? votesCount : null,
      country: info.originCountry ? getOriginCountryTitle(info.originCountry) : null,
      translationState: parseTranslationState(info.translitionStatus),
    };
  };

  const fetchChapters = async (
    mangaId: string,
    mangaSlug: string,
  ): Promise<{ chapters: RawChapter[]; translators: string[] }> => {
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
    return { chapters: chapters.reverse(), translators: [...teamsById.values()] };
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const { mangaId, mangaSlug } = parseMangaUrl(mangaUrl);
    const [data, { chapters, translators }] = await Promise.all([
      postGraphQl(DETAILS_QUERY, { slug: mangaSlug }),
      fetchChapters(mangaId, mangaSlug),
    ]);
    const info = data['manga'] as MangaInfoJson | undefined;
    if (!info) throw new ParseError(`Cannot parse manga details: ${mangaUrl}`, SOURCE_ID);
    const manga = parseMangaInfo(info, translators);
    if (!manga) throw new ParseError(`Cannot parse manga details: ${mangaUrl}`, SOURCE_ID);
    return { ...manga, chapters };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const parts = chapterUrl.split(URL_DELIMITER);
    const mangaId = parts[0];
    const chapterId = parts[2];
    if (!mangaId) throw new ParseError(`Cannot parse manga id: ${chapterUrl}`, SOURCE_ID);
    if (!chapterId) throw new ParseError(`Cannot parse chapter id: ${chapterUrl}`, SOURCE_ID);

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
      locale: SOURCE_LOCALE.RU,
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
        rating
        score
        status
        labels {
          slug
          titles {
            lang
            content
          }
        }
        localizations {
          lang
          description {
            ... on TiptapNodeNestedBlock {
              content {
                ... on TiptapNodeText {
                  text
                }
                ... on TiptapNodeOnlyBlock {
                  type
                }
              }
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

// manga(slug) is the only query exposing views/originCountry/translitionStatus/publishers/
// releasedOn/createdAt (see MangaInfoJson) — mangaTachiyomiInfo's MangaTachiyomi type doesn't
// carry them, confirmed live against api.senkuro.com since introspection is disabled.
const DETAILS_QUERY = `
query fetchManga($slug: String!) {
  manga(slug: $slug) {
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
      description {
        ... on TiptapNodeNestedBlock {
          content {
            ... on TiptapNodeText {
              text
            }
            ... on TiptapNodeOnlyBlock {
              type
            }
          }
        }
      }
    }
    type
    rating
    score
    status
    formats
    labels {
      slug
      titles {
        lang
        content
      }
    }
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
    releasedOn
    views
    originCountry
    translitionStatus
    createdAt
    publishers {
      name
    }
    scoreDistributions {
      count
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

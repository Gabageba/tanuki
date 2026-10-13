import {
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
  type EnumLiteralsOf,
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
  RawFilterGroup,
  RawFilterOption,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { parseFloatOrNull } from '../../core/text/numbers';
import { NotFoundError } from '../../errors';
import { fetchHomeSections } from '../../core/home';
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

/** Блоки главной remanga.org — проверено вживую 2026-10-12. «Горячие новинки» отдаёт v3
 *  `slider_type=hot_new`, остальные — слайдеры v2 по id или dir. */
export const REMANGA_HOME_SECTION = {
  HOT_NEW: 'hotNew',
  NEW_SEASON: 'newSeason',
  TRENDING: 'trending',
  POPULAR_TODAY: 'popularToday',
  NEW_CHAPTERS: 'newChapters',
  POPULAR: 'popular',
} as const;
type RemangaHomeSection = EnumLiteralsOf<typeof REMANGA_HOME_SECTION>;

const REMANGA_HOME_SECTIONS: { id: RemangaHomeSection; title: string }[] = [
  { id: REMANGA_HOME_SECTION.HOT_NEW, title: 'Горячие новинки' },
  { id: REMANGA_HOME_SECTION.NEW_SEASON, title: 'Новый сезон' },
  { id: REMANGA_HOME_SECTION.TRENDING, title: 'В тренде' },
  { id: REMANGA_HOME_SECTION.POPULAR_TODAY, title: 'Популярно сегодня' },
  { id: REMANGA_HOME_SECTION.NEW_CHAPTERS, title: 'Свежие главы' },
  { id: REMANGA_HOME_SECTION.POPULAR, title: 'Популярное' },
];

/** Слайдер v2 блока — `/api/v2/titles/sliders/{dir}/`; у «Популярного» dir словом, не числом.
 *  «Горячие новинки» живут в v3 и слайдера v2 не имеют. */
const getRemangaSliderDir = (section: RemangaHomeSection): string | null => {
  switch (section) {
    case REMANGA_HOME_SECTION.HOT_NEW:
      return null;
    case REMANGA_HOME_SECTION.NEW_SEASON:
      return '20';
    case REMANGA_HOME_SECTION.TRENDING:
      return '35';
    case REMANGA_HOME_SECTION.POPULAR_TODAY:
      return '22';
    case REMANGA_HOME_SECTION.NEW_CHAPTERS:
      return '26';
    case REMANGA_HOME_SECTION.POPULAR:
      return 'popular-anime';
  }
};

const HOME_SECTION_SIZE = 20;

const STATES: Record<number, TitleState> = {
  1: TITLE_STATE.FINISHED,
  2: TITLE_STATE.ONGOING,
  3: TITLE_STATE.PAUSED,
  4: TITLE_STATE.ABANDONED,
  5: TITLE_STATE.UPCOMING,
};

/** status.id === 6 ("Лицензировано") means the publisher pulled scanlations after licensing the
 *  title — not a publication state, so it maps to `restriction` instead of `releaseState`. */
const LICENSED_STATUS_ID = 6;

/** translate_status ids 1..4 share STATES' 1/2/3 numbering by coincidence (Закончен/Продолжается/
 *  Заморожен) but diverge at 4 ("Нет переводчика" vs STATES' "Заброшен"), so this needs its own
 *  map rather than reusing STATES. */
const TRANSLATE_STATES: Record<number, TitleState> = {
  1: TITLE_STATE.FINISHED,
  2: TITLE_STATE.ONGOING,
  3: TITLE_STATE.PAUSED,
  4: TITLE_STATE.ABANDONED,
};

/** translate_status.id === 5 ("Не переводится (лицензировано)") is translate_status's own
 *  LICENSED_STATUS_ID — same rationale: not in TRANSLATE_STATES above, maps to `restriction`
 *  instead so translationState doesn't have to explain the legal reason. */
const TRANSLATE_LICENSED_STATUS_ID = 5;

/** creators[].type — verified live against api.remanga.org across ~140 titles: 1 is always a
 *  real person credited as the original writer (e.g. Yun In Wan on «Дьявол-адвокат Кукабара»,
 *  paired with artist Yang Kyung-Il as type 4); 3 is always a publishing company (Kodansha,
 *  Shueisha, AC.QQ/Tencent...); 4 is the illustrator — the only type present on solo-mangaka
 *  titles. 2 is rare and always a studio-with-logo entry (e.g. "Yuanqi dan manhua"), grouped with
 *  3 under `publishers` since that field already covers "Publishing house/studio credits". */
const CREATOR_TYPE = {
  AUTHOR: 1,
  STUDIO: 2,
  PUBLISHER: 3,
  ARTIST: 4,
} as const;

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

/** `creators[].type` — see CREATOR_TYPE below for what each id means. */
type CreatorJson = {
  name: string;
  type?: number;
};

type PublisherJson = {
  name?: string;
};

type BranchJson = {
  id: number;
  publishers?: PublisherJson[];
};

type MangaJson = {
  dir: string;
  main_name: string;
  secondary_name?: string;
  another_name?: string;
  /** Числом в каталоге, строкой («7.5») в слайдерах главной. */
  avg_rating?: number | string;
  cover: CoverJson;
  type?: TypeJson;
  status?: StatusJson;
  /** Status of remanga's own translation, distinct from `status` (the original's release). */
  translate_status?: StatusJson;
  age_limit?: AgeLimitJson;
  issue_year?: number;
  genres?: TagJson[];
  /** Narrower trope/setting tags shown alongside `genres` on the source itself (e.g.
   *  «Средневековье», «Исекай», «ГГ мужчина») — a second, more specific vocabulary, not a subset
   *  of genres. */
  categories?: TagJson[];
  description?: string;
  /** Original work's writer/artist/publisher credits — absent on list items, only `getDetails`
   *  requests carry it. */
  creators?: CreatorJson[];
  /** Vote count backing `avg_rating` — only present on `getDetails`, unlike `total_votes`/
   *  `total_views` below which the list endpoint already carries. */
  count_rating?: number;
  /** Unbounded "likes" counter, distinct from the 0..10 `avg_rating`. */
  total_votes?: number;
  total_views?: number;
  branches?: BranchJson[];
  detail?: { message?: string };
};

type ChapterJson = {
  id: number;
  /** API отдаёт номер строкой («205.1»), а в старых ответах встречается и числом. */
  chapter?: number | string;
  tome?: number | string;
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
const mangaTypeById = (id: number | undefined): RawTitleType | null => {
  switch (id) {
    case 1:
      return TITLE_TYPE.MANGA;
    case 2:
      return TITLE_TYPE.MANHWA;
    case 3:
      return TITLE_TYPE.MANHUA;
    case 4:
      return TITLE_TYPE.COMICS;
    case undefined:
      return null;
    default:
      return TITLE_TYPE.OTHER;
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

const getRemangaTypeKeys = (value: TitleType): string[] => {
  switch (value) {
    case TITLE_TYPE.MANGA:
      return ['1'];
    case TITLE_TYPE.MANHWA:
      return ['2'];
    case TITLE_TYPE.MANHUA:
      return ['3'];
    case TITLE_TYPE.COMICS:
      return ['4'];
    case TITLE_TYPE.OTHER:
      return ['5', '6', '7', '22'];
  }
};

const getRemangaStateKeys = (value: TitleState): string[] => {
  switch (value) {
    case TITLE_STATE.ONGOING:
      return ['2'];
    case TITLE_STATE.FINISHED:
      return ['1'];
    case TITLE_STATE.PAUSED:
      return ['3'];
    case TITLE_STATE.ABANDONED:
      // The status filter has no such option (STATUS_OPTIONS) — the criterion stays unapplied.
      return [];
    case TITLE_STATE.UPCOMING:
      return ['5'];
  }
};

/** Search criteria -> this source's own filter groups (see resolveSearchFilters). */
const SEARCH_FILTER_SPEC: SearchFilterSpec = {
  types: { groupId: REMANGA_FILTER_GROUP.TYPE, isMultiple: true, getKeys: getRemangaTypeKeys },
  states: { groupId: REMANGA_FILTER_GROUP.STATUS, isMultiple: true, getKeys: getRemangaStateKeys },
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

  /** genre/category keys carry a 'g'/'c' prefix so the two vocabularies can't collide once
   *  merged into one display list — each is its own id sequence on the source. */
  const parseTag = (prefix: string, jo: TagJson): RawTag => {
    return { title: toTitleCase(jo.name), key: `${prefix}${jo.id}`, source: SOURCE_ID };
  };

  const parseTags = (
    genres: TagJson[] | undefined,
    categories: TagJson[] | undefined,
  ): RawTag[] => {
    const seenTitles = new Set<string>();
    const result: RawTag[] = [];
    for (const tag of [
      ...(genres ?? []).map((g) => parseTag('g', g)),
      ...(categories ?? []).map((c) => parseTag('c', c)),
    ]) {
      if (seenTitles.has(tag.title)) continue;
      seenTitles.add(tag.title);
      result.push(tag);
    }
    return result;
  };

  const parseCreators = (
    creators: CreatorJson[] | undefined,
  ): { authors: string[]; artists: string[]; publishers: string[] } => {
    const authors: string[] = [];
    const artists: string[] = [];
    const publishers: string[] = [];
    for (const creator of creators ?? []) {
      switch (creator.type) {
        case CREATOR_TYPE.AUTHOR:
          authors.push(creator.name);
          break;
        case CREATOR_TYPE.ARTIST:
          artists.push(creator.name);
          break;
        case CREATOR_TYPE.STUDIO:
        case CREATOR_TYPE.PUBLISHER:
          publishers.push(creator.name);
          break;
      }
    }
    return { authors, artists, publishers };
  };

  /** Each branch is a distinct translation stream — its `publishers` are the team(s) credited
   *  for it, so the same names back both `translators` and each chapter's `branch`. */
  const parseTranslators = (branches: BranchJson[] | undefined): string[] => {
    const names = new Set<string>();
    for (const branch of branches ?? []) {
      for (const publisher of branch.publishers ?? []) {
        if (publisher.name) names.add(publisher.name);
      }
    }
    return [...names];
  };

  const parseManga = (jo: MangaJson): RawTitle => {
    const url = `/manga/${jo.dir}`;
    const cover = jo.cover;
    return {
      id: generateUid(SOURCE_ID, url),
      title: jo.main_name,
      altTitles: jo.secondary_name ? [jo.secondary_name] : [],
      url,
      publicUrl: `https://${domain}${url}/main`,
      rating: jo.avg_rating != null ? Number(jo.avg_rating) / 10 : RATING_UNKNOWN,
      contentRating: null,
      coverUrl: cover.mid ? toAbsoluteUrl(cover.mid, apiHost) : null,
      largeCoverUrl: cover.high ? toAbsoluteUrl(cover.high, apiHost) : null,
      tags: parseTags(jo.genres, jo.categories),
      releaseState: jo.status?.id != null ? (STATES[jo.status.id] ?? null) : null,
      translationState:
        jo.translate_status?.id != null ? (TRANSLATE_STATES[jo.translate_status.id] ?? null) : null,
      restriction:
        jo.status?.id === LICENSED_STATUS_ID ||
        jo.translate_status?.id === TRANSLATE_LICENSED_STATUS_ID
          ? TITLE_RESTRICTION.LEGAL
          : null,
      type: mangaTypeById(jo.type?.id),
      year: jo.issue_year ?? null,
      authors: [],
      likes: jo.total_votes ?? null,
      views: jo.total_views ?? null,
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
  ): Promise<RawTitle[]> => {
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

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
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

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
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
      const branchName =
        branch.publishers
          ?.map((p) => p.name)
          .filter((n): n is string => !!n)
          .join(', ') || null;
      const branchChapters = (await fetchAllChapters(branch.id)).slice().reverse();
      for (const cjo of branchChapters) {
        if (cjo.is_paid && !cjo.is_bought) {
          hadPaidChapters = true;
          continue;
        }
        chapters.push({
          id: generateUid(SOURCE_ID, cjo.id),
          title: cjo.name ? toTitleCase(cjo.name) : null,
          number: parseFloatOrNull(cjo.chapter?.toString()),
          volume: parseFloatOrNull(cjo.tome?.toString()),
          url: `/api/v2/titles/chapters/${cjo.id}/`,
          scanlator: cjo.publishers?.[0]?.name ?? branchName,
          uploadDate: parseIsoDate(cjo.upload_date),
          branch: branchName,
          source: SOURCE_ID,
        });
      }
    }

    const { authors, artists, publishers } = parseCreators(json.creators);
    const translators = parseTranslators(json.branches);

    // country, magazines and a release date more granular than `year` have no equivalent on
    // api.remanga.org — confirmed live across ~140 titles' full details payloads: no `country`
    // field exists (type.id is the only origin signal, and it drives `type` itself rather than a
    // separate raw string), no serialization-magazine field exists, and issue_year is the only
    // date the API exposes for the original release (new_season_date exists but is null on every
    // title sampled, announced or not). releaseFormats and an "added to catalog" date are the
    // same story — no such field anywhere in the payload.
    return {
      id: generateUid(SOURCE_ID, url),
      title: json.main_name,
      altTitles,
      url,
      publicUrl: `https://${domain}${url}/main`,
      rating: json.avg_rating != null ? Number(json.avg_rating) / 10 : RATING_UNKNOWN,
      contentRating:
        json.age_limit?.id === 0
          ? CONTENT_RATING.SAFE
          : json.age_limit?.id === 1 || json.age_limit?.id === 2
            ? CONTENT_RATING.SUGGESTIVE
            : null,
      coverUrl: cover.mid ? toAbsoluteUrl(cover.mid, apiHost) : null,
      largeCoverUrl: cover.high ? toAbsoluteUrl(cover.high, apiHost) : null,
      tags: parseTags(json.genres, json.categories),
      releaseState: json.status?.id != null ? (STATES[json.status.id] ?? null) : null,
      translationState:
        json.translate_status?.id != null
          ? (TRANSLATE_STATES[json.translate_status.id] ?? null)
          : null,
      restriction:
        json.status?.id === LICENSED_STATUS_ID ||
        json.translate_status?.id === TRANSLATE_LICENSED_STATUS_ID
          ? TITLE_RESTRICTION.LEGAL
          : chapters.length === 0 && hadPaidChapters
            ? TITLE_RESTRICTION.PAYWALL
            : null,
      type: mangaTypeById(json.type?.id),
      year: json.issue_year ?? null,
      authors,
      artists,
      publishers,
      translators,
      votesCount: json.count_rating ?? null,
      likes: json.total_votes ?? null,
      views: json.total_views ?? null,
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

  const fetchHomeSection = async (section: RemangaHomeSection): Promise<RawTitle[]> => {
    const dir = getRemangaSliderDir(section);
    if (dir === null) {
      const json = await ctx.http.getJson<{ results: MangaJson[] }>(
        `https://${apiHost}/api/v3/titles/?slider_type=hot_new&count=${HOME_SECTION_SIZE}`,
      );
      return json.results.map(parseManga);
    }
    const json = await ctx.http.getJson<{ titles?: { title: MangaJson }[] }>(
      `https://${apiHost}/api/v2/titles/sliders/${dir}/`,
    );
    return (json.titles ?? []).map(({ title }) => parseManga(title));
  };

  const getHome = () => fetchHomeSections(REMANGA_HOME_SECTIONS, fetchHomeSection);

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
      isSearchWithFiltersSupported: true,
      homeSections: REMANGA_HOME_SECTIONS,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    getHome,
    resolveSearchFilters: (criteria) => buildSearchFilters(criteria, SEARCH_FILTER_SPEC),
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

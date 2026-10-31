import {
  HOME_SECTION_KIND,
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_STATE,
  TITLE_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type TitleState,
  SOURCE_LOCALE,
  type EnumLiteralsOf,
  type HomeSectionVariant,
  type TitleType,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import { CHAPTERS_COUNT_PRESETS, getYearRangePresets } from '../../core/filters/range-presets';
import { FILTER_GROUP } from '../../core/filters/group';
import { buildSearchFilters, type SearchFilterSpec } from '../../core/filters/searchFilters';
import type {
  RawTitle,
  RawChapter,
  RawPage,
  RawTag,
  RawContentRating,
  RawFilterGroup,
  RawFilterOption,
  RawTitleType,
  RawHomeSectionInfo,
  RawHomeSectionPage,
  RawHomeSectionParams,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { ParseError } from '../../errors';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';
import { fetchHomeSections } from '../../core/home';
import type { ChapterJson, MangaJson } from './models';
import { fetchTomiloLibBookmarks } from './bookmarks';

const SOURCE_ID = CATALOG_SOURCE_ID.TOMILOLIB;

/** Блоки главной tomilo-lib.ru — страница рисуется в браузере, блоки берёт из своих
 *  эндпоинтов (найдены в бандле главной, проверены вживую 2026-10-12; «Читают на этой неделе»,
 *  «Недооценённые» и «Топ тайтлов» — 2026-10-14). */
export const TOMILOLIB_HOME_SECTION = {
  POPULAR_WEEK: 'popularWeek',
  TOP_WEEK: 'topWeek',
  NEW_CHAPTERS: 'newChapters',
  READING_WEEK: 'readingWeek',
  UNDERRATED: 'underrated',
  TOP_TITLES: 'topTitles',
} as const;
type TomiloLibHomeSection = EnumLiteralsOf<typeof TOMILOLIB_HOME_SECTION>;

/** Вкладки «Топа тайтлов» — каталог по просмотрам: тайтлы текущего года, манхва, маньхуа. */
const TOMILOLIB_TOP_TITLES_TAB = {
  CURRENT_YEAR: 'currentYear',
  MANHWA: 'manhwa',
  MANHUA: 'manhua',
} as const;
type TomiloLibTopTitlesTab = EnumLiteralsOf<typeof TOMILOLIB_TOP_TITLES_TAB>;

const TOMILOLIB_TOP_TITLES_TABS: (HomeSectionVariant & { id: TomiloLibTopTitlesTab })[] = [
  // Сайт пишет год числом («Топ-2026»), но info собирается один раз при старте процесса и
  // пережил бы Новый год — поэтому подпись без числа, а год берётся в момент запроса.
  { id: TOMILOLIB_TOP_TITLES_TAB.CURRENT_YEAR, title: 'Топ года' },
  { id: TOMILOLIB_TOP_TITLES_TAB.MANHWA, title: 'Топ манхвы' },
  { id: TOMILOLIB_TOP_TITLES_TAB.MANHUA, title: 'Топ маньхуа' },
];

/** Отбор каталога вкладки «Топа тайтлов»; чужая вкладка — первая. */
const getTopTitlesTabParams = (variant: string | undefined): Record<string, string> => {
  const tab =
    TOMILOLIB_TOP_TITLES_TABS.find(({ id }) => id === variant)?.id ??
    TOMILOLIB_TOP_TITLES_TAB.CURRENT_YEAR;
  switch (tab) {
    case TOMILOLIB_TOP_TITLES_TAB.CURRENT_YEAR:
      return { releaseYear: String(new Date().getFullYear()) };
    case TOMILOLIB_TOP_TITLES_TAB.MANHWA:
      return { types: 'manhwa' };
    case TOMILOLIB_TOP_TITLES_TAB.MANHUA:
      return { types: 'manhua' };
  }
};

const TOMILOLIB_HOME_SECTIONS: (RawHomeSectionInfo & { id: TomiloLibHomeSection })[] = [
  {
    id: TOMILOLIB_HOME_SECTION.POPULAR_WEEK,
    title: 'Популярное за неделю',
    kind: HOME_SECTION_KIND.POPULAR,
  },
  { id: TOMILOLIB_HOME_SECTION.TOP_WEEK, title: 'Топ-5 недели', kind: HOME_SECTION_KIND.TOP },
  {
    id: TOMILOLIB_HOME_SECTION.NEW_CHAPTERS,
    title: 'Новые главы',
    kind: HOME_SECTION_KIND.UPDATES,
  },
  {
    id: TOMILOLIB_HOME_SECTION.READING_WEEK,
    title: 'Читают на этой неделе',
    kind: HOME_SECTION_KIND.TRENDING,
  },
  { id: TOMILOLIB_HOME_SECTION.UNDERRATED, title: 'Недооценённые', kind: HOME_SECTION_KIND.TOP },
  {
    id: TOMILOLIB_HOME_SECTION.TOP_TITLES,
    title: 'Топ тайтлов',
    kind: HOME_SECTION_KIND.TOP,
    variants: TOMILOLIB_TOP_TITLES_TABS,
  },
];

/** `/titles/top/week` отдаёт не больше 50 тайтлов и не по порядку — сайт сам сортирует их по
 *  `views`. */
const READING_WEEK_LIMIT = 50;
/** Кандидаты «Недооценённых» — первая страница каталога по рейтингу: больше 50 API не отдаёт. */
const UNDERRATED_CANDIDATES_LIMIT = 50;
const UNDERRATED_SIZE = 20;

/** «Недооценённые» — как их отбирает сам сайт: рейтинг от 7.5 и просмотров не больше, чем у
 *  35% кандидатов; не нашлось таких — рейтинг от 7, самые малопросматриваемые первыми. */
const pickUnderrated = (candidates: MangaJson[]): MangaJson[] => {
  const getViews = (item: MangaJson) => item.views ?? 0;
  const getRating = (item: MangaJson) => item.averageRating ?? 0;
  const views = candidates.map(getViews).sort((a, b) => a - b);
  const maxViews = views[Math.floor(views.length * 0.35)] ?? 0;
  const picked = candidates.filter((item) => getRating(item) >= 7.5 && getViews(item) <= maxViews);
  if (picked.length > 0) return picked.slice(0, UNDERRATED_SIZE);
  return candidates
    .filter((item) => getRating(item) >= 7)
    .sort((a, b) => getViews(a) - getViews(b))
    .slice(0, UNDERRATED_SIZE);
};

const PAGE_SIZE = 24;
const CDN_URL = 'https://s3.regru.cloud/tomilolib';
const IMAGE_ACCEPT = 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5';
const YEAR_RANGE_FALLBACK_MIN = 1990;
const YEAR_RANGE_CUTOFF = 2000;

export const TOMILOLIB_FILTER_GROUP = {
  GENRE: FILTER_GROUP.GENRE,
  TYPE: FILTER_GROUP.TYPE,
  STATUS: FILTER_GROUP.STATUS,
  RELEASE_YEAR: FILTER_GROUP.RELEASE_YEAR,
  CHAPTERS_COUNT: FILTER_GROUP.CHAPTERS_COUNT,
} as const;

/** `type` on the manga/list JSON is a free-text field the site itself writes inconsistently
 *  (some titles carry the Russian label instead of the code) — these four lowercase codes are
 *  the only ones /api/titles actually filters on, verified live against tomilo-lib.ru. */
const TYPE_OPTIONS: RawFilterOption[] = [
  { key: 'manga', title: 'Манга', count: null },
  { key: 'manhwa', title: 'Манхва', count: null },
  { key: 'manhua', title: 'Маньхуа', count: null },
  { key: 'comic', title: 'Комикс', count: null },
];

/** Same four values parseState() below maps from — verified live via /api/titles?status=. */
const STATUS_OPTIONS: RawFilterOption[] = [
  { key: 'ongoing', title: 'Онгоинг', count: null },
  { key: 'completed', title: 'Завершён', count: null },
  { key: 'pause', title: 'Приостановлен', count: null },
  { key: 'cancelled', title: 'Отменён', count: null },
];

type FilterOptionsJson = {
  genres?: string[];
  releaseYears?: number[];
  chaptersMin?: number;
  chaptersMax?: number;
};

/** Элемент блоков главной — короче элемента каталога: `id`/`title`/`cover` вместо
 *  `_id`/`name`/`coverImage`, рейтинг 0..10. Обложка — то полным адресом, то путём `/uploads/`,
 *  как в каталоге. */
type HomeTitleJson = {
  id?: string;
  slug?: string;
  title?: string;
  cover?: string;
  rating?: number;
  type?: string;
  releaseYear?: number;
  totalChapters?: number;
  views?: number;
};

/** Ответ каталога `/titles`. */
type CatalogJson = {
  data?: { titles?: MangaJson[]; pagination?: { pages?: number } };
};

const getApiSortBy = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.VIEWS_WEEK:
      return 'weekViews';
    case SORT_ORDER.VIEWS_TODAY:
      return 'dayViews';
    case SORT_ORDER.VIEWS_MONTH:
      return 'monthViews';
    case SORT_ORDER.VIEWS:
      return 'views';
    case SORT_ORDER.ADDED:
      return 'createdAt';
    // "Дате релиза" on the site — releaseYear, not createdAt.
    case SORT_ORDER.RELEASED:
      return 'releaseYear';
    case SORT_ORDER.RATING:
      return 'averageRating';
    case SORT_ORDER.CHAPTERS:
      return 'totalChapters';
    case SORT_ORDER.ALPHABETICAL:
      return 'name';
    // UPDATED and no explicit order — same as the site's default /titles?sortBy=updatedAt
    default:
      return 'updatedAt';
  }
};

// The site only sends sortOrder=asc for the ascending case; descending is the default and the
// param is left off the request entirely (an explicit "desc" is not a value it expects).
const getApiSortOrder = (direction: string | undefined): string => {
  return direction === SORT_DIRECTION.ASC ? 'asc' : '';
};

const parseContentRating = (info: MangaJson): RawContentRating => {
  const ageLimit = info.ageLimit ?? 0;
  if (info.isAdult === true || ageLimit >= 18) return CONTENT_RATING.ADULT;
  if (ageLimit >= 16) return CONTENT_RATING.SUGGESTIVE;
  return CONTENT_RATING.SAFE;
};

/** Same free-text field the `type` filter matches on (see TYPE_OPTIONS above) — the site writes
 *  the Russian label on some titles instead of the code, so both are mapped here. */
const parseMangaType = (raw: string | undefined): RawTitleType | null => {
  switch (raw?.trim().toLowerCase()) {
    case 'manga':
    case 'манга':
      return TITLE_TYPE.MANGA;
    case 'manhwa':
    case 'манхва':
      return TITLE_TYPE.MANHWA;
    case 'manhua':
    case 'маньхуа':
      return TITLE_TYPE.MANHUA;
    case 'comic':
    case 'комикс':
      return TITLE_TYPE.COMICS;
    default:
      return null;
  }
};

const parseState = (raw: string | undefined): TitleState | null => {
  switch (raw?.toLowerCase()) {
    case 'ongoing':
      return TITLE_STATE.ONGOING;
    case 'completed':
      return TITLE_STATE.FINISHED;
    case 'pause':
      return TITLE_STATE.PAUSED;
    case 'cancelled':
      return TITLE_STATE.ABANDONED;
    default:
      return null;
  }
};

const splitList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/[,;/]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const toCdnUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const withoutUploads = path.startsWith('/uploads') ? path.slice('/uploads'.length) : path;
  const normalized = withoutUploads.startsWith('/') ? withoutUploads : `/${withoutUploads}`;
  return `${CDN_URL}${normalized}`;
};

const toCleanString = (n: number): string => {
  return Number.isInteger(n) ? String(n) : String(n);
};

const buildChapterTitle = (
  number: number | null,
  name: string | null | undefined,
): string | null => {
  const title = name?.trim() ?? '';
  if (title.length > 0) return title;
  return number !== null ? `Глава ${toCleanString(number)}` : null;
};

const parseDate = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const parsed = Date.parse(raw.trim());
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getTomiloLibTypeKeys = (value: TitleType): string[] => {
  switch (value) {
    case TITLE_TYPE.MANGA:
      return ['manga'];
    case TITLE_TYPE.MANHWA:
      return ['manhwa'];
    case TITLE_TYPE.MANHUA:
      return ['manhua'];
    case TITLE_TYPE.COMICS:
      return ['comic'];
    case TITLE_TYPE.OTHER:
      return [];
  }
};

const getTomiloLibStateKeys = (value: TitleState): string[] => {
  switch (value) {
    case TITLE_STATE.ONGOING:
      return ['ongoing'];
    case TITLE_STATE.FINISHED:
      return ['completed'];
    case TITLE_STATE.PAUSED:
      return ['pause'];
    case TITLE_STATE.ABANDONED:
      return ['cancelled'];
    case TITLE_STATE.UPCOMING:
      return [];
  }
};

/** Search criteria -> this source's own filter groups (see resolveSearchFilters). */
const SEARCH_FILTER_SPEC: SearchFilterSpec = {
  types: { groupId: TOMILOLIB_FILTER_GROUP.TYPE, isMultiple: false, getKeys: getTomiloLibTypeKeys },
  states: {
    groupId: TOMILOLIB_FILTER_GROUP.STATUS,
    isMultiple: false,
    getKeys: getTomiloLibStateKeys,
  },
};

export const createTomiloLibParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  ctx.http.use((req, next) => {
    const headers: Record<string, string> = { ...req.headers, Referer: `https://${domain}/` };
    try {
      if (new URL(req.url).hostname === 's3.regru.cloud') {
        headers['Accept'] = IMAGE_ACCEPT;
      }
    } catch {
      /* not a valid URL — leave headers as-is */
    }
    return next({ ...req, headers });
  });

  const apiUrl = (path: string): URL => {
    return new URL(`https://${domain}/api/${path}`);
  };

  const parseTags = (info: MangaJson): RawTag[] => {
    const values = [...(info.genres ?? []), ...(info.tags ?? [])];
    const seen = new Set<string>();
    const tags: RawTag[] = [];
    for (const raw of values) {
      const value = raw.trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      tags.push({ key: value, title: value, source: SOURCE_ID });
    }
    return tags;
  };

  const parseChapterList = (
    chapters: ChapterJson[],
    slug: string,
    titleId: string,
  ): RawChapter[] => {
    return chapters
      .filter((ch) => ch._id && ch.isPublished !== false)
      .map((ch): RawChapter => {
        const number = ch.chapterNumber ?? null;
        const url = `/titles/${slug}/chapter/${ch._id}?titleId=${titleId}`;
        return {
          id: generateUid(SOURCE_ID, url),
          title: buildChapterTitle(number, ch.name),
          number,
          volume: null,
          url,
          scanlator: null,
          uploadDate: parseDate(ch.releaseDate ?? ch.createdAt),
          branch: null,
          source: SOURCE_ID,
        };
      });
  };

  const parseManga = (info: MangaJson | null): RawTitle | null => {
    if (!info || !info._id || !info.slug) return null;
    const slug = info.slug;
    const title = info.name ?? slug;
    const url = `/titles/${slug}`;
    const cover = info.coverImage ? toCdnUrl(info.coverImage) : null;
    const authors = splitList(info.author);
    const artists = splitList(info.artist);
    const rating =
      info.averageRating != null && info.averageRating > 0
        ? info.averageRating / 10
        : RATING_UNKNOWN;

    return {
      id: generateUid(SOURCE_ID, url),
      title,
      altTitles: info.altNames?.map((s) => s.trim()).filter((s) => s.length > 0) ?? [],
      url,
      publicUrl: `https://${domain}${url}`,
      rating,
      contentRating: parseContentRating(info),
      coverUrl: cover,
      largeCoverUrl: cover,
      tags: parseTags(info),
      releaseState: parseState(info.status),
      authors: [...new Set(authors)],
      artists: [...new Set(artists)],
      description: info.description ?? null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(info.type),
      year: info.releaseYear ?? null,
      chaptersCount: info.totalChapters ?? null,
      votesCount: info.totalRatings ?? null,
      views: info.views ?? null,
      addedAt: parseDate(info.createdAt),
    };
  };

  /**
   * status and type only ever match an exact single value on the API — a comma-joined list
   * silently matches nothing and a repeated query key 500s the backend ("param.replace is not a
   * function"), both verified live. genres is the opposite: it takes one comma-joined string and
   * matches any title carrying at least one of them (OR, not AND) — also verified live.
   */
  const applyFilterParams = (url: URL, filters: FilterSelection[] | undefined): void => {
    if (!filters || filters.length === 0) return;
    const genres: string[] = [];
    for (const filter of filters) {
      if ('range' in filter) {
        const param =
          filter.groupId === TOMILOLIB_FILTER_GROUP.RELEASE_YEAR ? 'releaseYear' : 'chapters';
        if (filter.range.min != null)
          url.searchParams.set(`${param}From`, String(filter.range.min));
        if (filter.range.max != null) url.searchParams.set(`${param}To`, String(filter.range.max));
        continue;
      }
      switch (filter.groupId) {
        case TOMILOLIB_FILTER_GROUP.GENRE:
          genres.push(filter.key);
          break;
        case TOMILOLIB_FILTER_GROUP.TYPE:
          url.searchParams.set('type', filter.key);
          break;
        case TOMILOLIB_FILTER_GROUP.STATUS:
          url.searchParams.set('status', filter.key);
          break;
      }
    }
    if (genres.length > 0) url.searchParams.set('genres', genres.join(','));
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    direction: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawTitle[]> => {
    const url = apiUrl('titles');
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('includeAdult', 'true');
    url.searchParams.set('sortBy', getApiSortBy(order));
    const sortOrder = getApiSortOrder(direction);
    if (sortOrder) url.searchParams.set('sortOrder', sortOrder);
    if (query?.trim()) url.searchParams.set('search', query.trim());
    applyFilterParams(url, filters);

    const json = await ctx.http.getJson<{ data?: { titles?: MangaJson[] } }>(url.toString());
    const titles = json.data?.titles ?? [];
    return titles.map((t) => parseManga(t)).filter((m): m is RawTitle => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.direction, params.query, params.filters),
    );
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const json = await ctx.http.getJson<{ data?: FilterOptionsJson }>(
      apiUrl('titles/filters/options').toString(),
    );
    const data = json.data ?? {};
    const genres: RawFilterOption[] = (data.genres ?? []).map((g) => ({
      key: g,
      title: g,
      count: null,
    }));
    const currentYear = new Date().getFullYear();
    const releaseYears = data.releaseYears ?? [];
    const yearMin = releaseYears.length > 0 ? Math.min(...releaseYears) : YEAR_RANGE_FALLBACK_MIN;
    const yearMax = releaseYears.length > 0 ? Math.max(...releaseYears, currentYear) : currentYear;

    return [
      {
        id: TOMILOLIB_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX,
        options: genres,
      },
      {
        id: TOMILOLIB_FILTER_GROUP.TYPE,
        title: 'Тип',
        type: FILTER_TYPE.RADIO,
        options: TYPE_OPTIONS,
      },
      {
        id: TOMILOLIB_FILTER_GROUP.STATUS,
        title: 'Статус',
        type: FILTER_TYPE.RADIO,
        options: STATUS_OPTIONS,
      },
      {
        id: TOMILOLIB_FILTER_GROUP.RELEASE_YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: yearMin, max: yearMax, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(yearMin, yearMax, YEAR_RANGE_CUTOFF),
        },
      },
      {
        id: TOMILOLIB_FILTER_GROUP.CHAPTERS_COUNT,
        title: 'Количество глав',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: data.chaptersMin ?? 0, max: data.chaptersMax ?? 2000 },
          presets: CHAPTERS_COUNT_PRESETS,
        },
      },
    ];
  };

  const fetchChapters = async (titleId: string, slug: string): Promise<RawChapter[]> => {
    const url = apiUrl(`chapters/title/${titleId}`);
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', '10000');
    url.searchParams.set('sortOrder', 'asc');
    const json = await ctx.http.getJson<{ data?: { chapters?: ChapterJson[] } }>(url.toString());
    return parseChapterList(json.data?.chapters ?? [], slug, titleId);
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const slug = mangaUrl.replace(/\/$/, '').split('/').pop();
    if (!slug) throw new ParseError(`Cannot parse title slug: ${mangaUrl}`, SOURCE_ID);
    const url = apiUrl(`titles/slug/${slug}`);
    url.searchParams.set('populateChapters', 'true');
    const json = await ctx.http.getJson<{ data?: MangaJson }>(url.toString());
    const info = json.data;
    if (!info) throw new ParseError(`Cannot parse title details: ${mangaUrl}`, SOURCE_ID);
    const manga = parseManga(info);
    if (!manga) throw new ParseError(`Cannot parse title details: ${mangaUrl}`, SOURCE_ID);

    const titleId = info._id;
    const embeddedChapters =
      info.chapters && info.chapters.length > 0
        ? parseChapterList(info.chapters, slug, titleId ?? '')
        : [];
    const chapters =
      embeddedChapters.length > 0 || !titleId
        ? embeddedChapters
        : await fetchChapters(titleId, slug);

    return { ...manga, chapters };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const chapterId = new URL(chapterUrl, `https://${domain}/`).pathname
      .split('/')
      .filter(Boolean)
      .pop();
    if (!chapterId) throw new ParseError(`Cannot parse chapter id: ${chapterUrl}`, SOURCE_ID);
    const json = await ctx.http.getJson<{ data?: { pages?: string[] } }>(
      apiUrl(`chapters/${chapterId}`).toString(),
    );
    const pages = json.data?.pages ?? [];
    if (pages.length === 0) {
      throw new ParseError(`Cannot parse chapter pages: ${chapterUrl}`, SOURCE_ID);
    }
    return pages
      .map((path, i): RawPage | null => {
        const trimmed = path.trim();
        if (!trimmed) return null;
        return {
          id: generateUid(SOURCE_ID, `${chapterUrl}#${i}`),
          url: toCdnUrl(trimmed),
          preview: null,
          source: SOURCE_ID,
        };
      })
      .filter((p): p is RawPage => p !== null);
  };

  const parseHomeTitle = (jo: HomeTitleJson): RawTitle | null => {
    if (!jo.slug || !jo.title) return null;
    const url = `/titles/${jo.slug}`;
    return {
      id: generateUid(SOURCE_ID, url),
      title: jo.title,
      altTitles: [],
      url,
      publicUrl: `https://${domain}${url}`,
      rating: jo.rating != null && jo.rating > 0 ? jo.rating / 10 : RATING_UNKNOWN,
      contentRating: null,
      coverUrl: jo.cover ? toCdnUrl(jo.cover) : null,
      largeCoverUrl: null,
      tags: [],
      releaseState: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(jo.type),
      year: jo.releaseYear ?? null,
      chaptersCount: jo.totalChapters ?? null,
    };
  };

  const fetchHomeList = async (
    path: string,
    params: Record<string, string>,
  ): Promise<HomeTitleJson[]> => {
    const url = apiUrl(path);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const json = await ctx.http.getJson<{ data?: HomeTitleJson[] }>(url.toString());
    return json.data ?? [];
  };

  const fetchCatalog = async (params: Record<string, string>) => {
    const url = apiUrl('titles');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const json = await ctx.http.getJson<CatalogJson>(url.toString());
    return { titles: json.data?.titles ?? [], pages: json.data?.pagination?.pages ?? 0 };
  };

  const parseHomeTitles = (items: HomeTitleJson[]) =>
    items.map(parseHomeTitle).filter((item): item is RawTitle => item !== null);

  const parseMangas = (items: MangaJson[]) =>
    items.map(parseManga).filter((item): item is RawTitle => item !== null);

  /** Порция «Топа тайтлов» — страница каталога по просмотрам с отбором вкладки. */
  const fetchTopTitles = async ({
    page,
    variant,
  }: RawHomeSectionParams): Promise<RawHomeSectionPage> => {
    const { titles, pages } = await fetchCatalog({
      ...getTopTitlesTabParams(variant),
      sortBy: 'views',
      sortOrder: 'desc',
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    return { items: parseMangas(titles), hasNextPage: page < pages };
  };

  const fetchHomeSection = async (section: TomiloLibHomeSection): Promise<RawTitle[]> => {
    switch (section) {
      case TOMILOLIB_HOME_SECTION.POPULAR_WEEK:
        return parseHomeTitles(await fetchHomeList('titles/popular', { limit: '20' }));
      case TOMILOLIB_HOME_SECTION.TOP_WEEK:
        return parseHomeTitles(await fetchHomeList('titles/top/week', { limit: '5' }));
      case TOMILOLIB_HOME_SECTION.NEW_CHAPTERS:
        return parseHomeTitles(
          await fetchHomeList('titles/latest-updates', { page: '1', limit: '24' }),
        );
      case TOMILOLIB_HOME_SECTION.READING_WEEK: {
        const items = await fetchHomeList('titles/top/week', {
          limit: String(READING_WEEK_LIMIT),
        });
        return parseHomeTitles(items.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)));
      }
      case TOMILOLIB_HOME_SECTION.UNDERRATED: {
        const { titles } = await fetchCatalog({
          sortBy: 'averageRating',
          sortOrder: 'desc',
          limit: String(UNDERRATED_CANDIDATES_LIMIT),
        });
        return parseMangas(pickUnderrated(titles));
      }
      case TOMILOLIB_HOME_SECTION.TOP_TITLES:
        return (await fetchTopTitles({ page: 1 })).items;
    }
  };

  const getHome = () => fetchHomeSections(TOMILOLIB_HOME_SECTIONS, fetchHomeSection);

  /** Порциями и по вкладкам листается только «Топ тайтлов», остальные блоки — один список. */
  const getHomeSection = async (id: string, params: RawHomeSectionParams) =>
    id === TOMILOLIB_HOME_SECTION.TOP_TITLES ? fetchTopTitles(params) : null;

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'TomiloLib',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        SORT_ORDER.VIEWS,
        SORT_ORDER.VIEWS_TODAY,
        SORT_ORDER.VIEWS_WEEK,
        SORT_ORDER.VIEWS_MONTH,
        SORT_ORDER.RATING,
        SORT_ORDER.CHAPTERS,
        SORT_ORDER.ALPHABETICAL,
        SORT_ORDER.UPDATED,
        SORT_ORDER.ADDED,
        SORT_ORDER.RELEASED,
      ],
      supportsDirection: true,
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: true,
      isSearchWithFiltersSupported: true,
      homeSections: TOMILOLIB_HOME_SECTIONS,
    },
    getHome,
    getHomeSection,
    getList,
    getDetails,
    getPages,
    getFilters,
    getBookmarks: () => fetchTomiloLibBookmarks(ctx, parseManga),
    resolveSearchFilters: (criteria) => buildSearchFilters(criteria, SEARCH_FILTER_SPEC),
    imageHeaders: () => ({ Referer: `https://${domain}/`, Accept: IMAGE_ACCEPT }),
  };
};

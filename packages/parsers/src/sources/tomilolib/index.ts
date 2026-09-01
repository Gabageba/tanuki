import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_STATE,
  MANGA_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type FilterRangePreset,
  type MangaState,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
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
import { ParseError } from '../../errors';

const SOURCE_ID = 'TOMILOLIB';
const PAGE_SIZE = 24;
const CDN_URL = 'https://s3.regru.cloud/tomilolib';
const IMAGE_ACCEPT = 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5';
const YEAR_RANGE_FALLBACK_MIN = 1990;
const DECADE_SIZE = 10;
const YEAR_RANGE_CUTOFF = 2000;

const CHAPTERS_COUNT_PRESETS: FilterRangePreset[] = [
  { id: 'lt-20', label: '< 20', max: 20 },
  { id: 'lt-50', label: '< 50', max: 50 },
  { id: '100-200', label: '100-200', min: 100, max: 200 },
  { id: '200-300', label: '200-300', min: 200, max: 300 },
  { id: '300-plus', label: '300+', min: 300 },
];

/** "Текущий год", the current-decade-so-far, a preset per full decade back to `YEAR_RANGE_CUTOFF`,
 *  then one trailing preset lumping everything older than that into "Раньше 2000". */
const getYearRangePresets = (minYear: number, maxYear: number): FilterRangePreset[] => {
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
  if (minYear < YEAR_RANGE_CUTOFF) {
    presets.push({
      id: `before-${YEAR_RANGE_CUTOFF}`,
      label: `Раньше ${YEAR_RANGE_CUTOFF}`,
      min: minYear,
      max: YEAR_RANGE_CUTOFF - 1,
    });
  }
  return presets;
};

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

type ChapterJson = {
  _id?: string;
  isPublished?: boolean;
  chapterNumber?: number;
  name?: string | null;
  releaseDate?: string | null;
  createdAt?: string | null;
};

type MangaJson = {
  _id?: string;
  slug?: string;
  name?: string;
  coverImage?: string;
  genres?: string[];
  tags?: string[];
  author?: string;
  artist?: string;
  altNames?: string[];
  averageRating?: number;
  isAdult?: boolean;
  ageLimit?: number;
  status?: string;
  type?: string;
  releaseYear?: number;
  totalChapters?: number;
  description?: string;
  chapters?: ChapterJson[];
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
    case SORT_ORDER.NEWEST:
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
const parseMangaType = (raw: string | undefined): RawMangaType | null => {
  switch (raw?.trim().toLowerCase()) {
    case 'manga':
    case 'манга':
      return MANGA_TYPE.MANGA;
    case 'manhwa':
    case 'манхва':
      return MANGA_TYPE.MANHWA;
    case 'manhua':
    case 'маньхуа':
      return MANGA_TYPE.MANHUA;
    case 'comic':
    case 'комикс':
      return MANGA_TYPE.COMICS;
    default:
      return null;
  }
};

const parseState = (raw: string | undefined): MangaState | null => {
  switch (raw?.toLowerCase()) {
    case 'ongoing':
      return MANGA_STATE.ONGOING;
    case 'completed':
      return MANGA_STATE.FINISHED;
    case 'pause':
      return MANGA_STATE.PAUSED;
    case 'cancelled':
      return MANGA_STATE.ABANDONED;
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

const buildChapterTitle = (number: number, name: string | null | undefined): string | null => {
  const title = name?.trim() ?? '';
  if (title.length > 0) return title;
  return number > 0 ? `Глава ${toCleanString(number)}` : null;
};

const parseDate = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const parsed = Date.parse(raw.trim());
  return Number.isNaN(parsed) ? 0 : parsed;
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
        const number = ch.chapterNumber ?? 0;
        const url = `/titles/${slug}/chapter/${ch._id}?titleId=${titleId}`;
        return {
          id: generateUid(SOURCE_ID, url),
          title: buildChapterTitle(number, ch.name),
          number,
          volume: 0,
          url,
          scanlator: null,
          uploadDate: parseDate(ch.releaseDate ?? ch.createdAt),
          branch: null,
          source: SOURCE_ID,
        };
      });
  };

  const parseManga = (info: MangaJson | null, withDetails: boolean): RawManga | null => {
    if (!info || !info._id || !info.slug) return null;
    const slug = info.slug;
    const title = info.name ?? slug;
    const url = `/titles/${slug}`;
    const cover = info.coverImage ? toCdnUrl(info.coverImage) : null;
    const authors = [...splitList(info.author), ...splitList(info.artist)];
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
      state: parseState(info.status),
      authors: [...new Set(authors)],
      description: withDetails ? (info.description ?? null) : null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(info.type),
      year: info.releaseYear ?? null,
      chaptersCount: info.totalChapters ?? null,
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
        const param = filter.groupId === 'releaseYear' ? 'releaseYear' : 'chapters';
        if (filter.range.min != null)
          url.searchParams.set(`${param}From`, String(filter.range.min));
        if (filter.range.max != null) url.searchParams.set(`${param}To`, String(filter.range.max));
        continue;
      }
      switch (filter.groupId) {
        case 'genre':
          genres.push(filter.key);
          break;
        case 'type':
          url.searchParams.set('type', filter.key);
          break;
        case 'status':
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
  ): Promise<RawManga[]> => {
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
    return titles.map((t) => parseManga(t, false)).filter((m): m is RawManga => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
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
      { id: 'genre', title: 'Жанры', type: FILTER_TYPE.SEARCHABLE_CHECKBOX, options: genres },
      { id: 'type', title: 'Тип', type: FILTER_TYPE.RADIO, options: TYPE_OPTIONS },
      { id: 'status', title: 'Статус', type: FILTER_TYPE.RADIO, options: STATUS_OPTIONS },
      {
        id: 'releaseYear',
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: yearMin, max: yearMax, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(yearMin, yearMax),
        },
      },
      {
        id: 'chaptersCount',
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

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const slug = mangaUrl.replace(/\/$/, '').split('/').pop();
    if (!slug) throw new ParseError('Cannot parse title slug', SOURCE_ID);
    const url = apiUrl(`titles/slug/${slug}`);
    url.searchParams.set('populateChapters', 'true');
    const json = await ctx.http.getJson<{ data?: MangaJson }>(url.toString());
    const info = json.data;
    if (!info) throw new ParseError('Cannot parse title details', SOURCE_ID);
    const manga = parseManga(info, true);
    if (!manga) throw new ParseError('Cannot parse title details', SOURCE_ID);

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
    if (!chapterId) throw new ParseError('Cannot parse chapter id', SOURCE_ID);
    const json = await ctx.http.getJson<{ data?: { pages?: string[] } }>(
      apiUrl(`chapters/${chapterId}`).toString(),
    );
    const pages = json.data?.pages ?? [];
    if (pages.length === 0) throw new ParseError('Cannot parse chapter pages', SOURCE_ID);
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

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'TomiloLib',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
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
        SORT_ORDER.NEWEST,
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
    imageHeaders: () => ({ Referer: `https://${domain}/`, Accept: IMAGE_ACCEPT }),
  };
};

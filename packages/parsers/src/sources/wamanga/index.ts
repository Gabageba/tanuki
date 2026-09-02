import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_STATE,
  MANGA_TYPE,
  RANGE_FORMAT,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type MangaState,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import { getYearRangePresets } from '../../core/filters/range-presets';
import { FILTER_GROUP } from '../../core/filters/group';
import type {
  RawManga,
  RawChapter,
  RawContentRating,
  RawFilterGroup,
  RawFilterOption,
  RawMangaType,
  RawPage,
  RawTag,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.WAMANGA;
const PAGE_SIZE = 20;
const YEAR_RANGE_MIN = 1990;
const YEAR_RANGE_CUTOFF = 2000;

export const WAMANGA_FILTER_GROUP = {
  TYPE: FILTER_GROUP.TYPE,
  STATUS: FILTER_GROUP.STATUS,
  TRANSLATION_STATUS: FILTER_GROUP.TRANSLATION_STATUS,
  AGE_RATING: FILTER_GROUP.AGE_RATING,
  RELEASE_YEAR: FILTER_GROUP.RELEASE_YEAR,
} as const;

/** `type` per the site's own OpenAPI spec — same five values parseMangaType() maps below,
 *  verified live against https://wamanga.ru/api/docs-json. `manuscript` is the site's own term
 *  for reader-submitted originals ("руманга"), distinct from a licensed/scanlated `comic`. */
const TYPE_OPTIONS: RawFilterOption[] = [
  { key: 'manga', title: 'Манга', count: null },
  { key: 'manhwa', title: 'Манхва', count: null },
  { key: 'manhua', title: 'Маньхуа', count: null },
  { key: 'comic', title: 'Комикс', count: null },
  { key: 'manuscript', title: 'Руманга', count: null },
];

/** `status`/`translationStatus` share this enum per the OpenAPI spec — the same seven values back
 *  both the title-status and translation-status filters, so STATUS_OPTIONS is reused for both. */
const STATUS_OPTIONS: RawFilterOption[] = [
  { key: 'announced', title: 'Анонс', count: null },
  { key: 'ongoing', title: 'Онгоинг', count: null },
  { key: 'hiatus', title: 'Приостановлен', count: null },
  { key: 'completed', title: 'Завершён', count: null },
  { key: 'abandoned', title: 'Заброшен', count: null },
  { key: 'cancelled', title: 'Отменён', count: null },
  { key: 'unknown', title: 'Неизвестно', count: null },
];

/** Mirrors parseContentRating() below — the raw pegiRating value doubles as its own label. */
const PEGI_RATING_OPTIONS: RawFilterOption[] = [
  { key: '3+', title: '3+', count: null },
  { key: '6+', title: '6+', count: null },
  { key: '12+', title: '12+', count: null },
  { key: '16+', title: '16+', count: null },
  { key: '18+', title: '18+', count: null },
];

type MangaJson = {
  id: string;
  slug: string;
  title: string;
  titleEnglish?: string;
  alternateTitles?: string[];
  coverUrl?: string;
  imageUrl?: string;
  genres?: string[];
  statusTitle?: string;
  authors?: string[];
  isAdult?: boolean;
  description?: string;
  teams?: { name?: string }[];
  year?: number;
  type?: string;
  pegiRating?: string;
  likes?: number;
};

type ChapterJson = {
  id: string;
  position?: number;
  title?: string;
  createdAt?: string;
};

type PageFileJson = {
  diskFile: string;
};

const parseState = (status: string | undefined): MangaState | null => {
  switch (status?.toLowerCase()) {
    case 'ongoing':
      return MANGA_STATE.ONGOING;
    case 'finished':
    case 'completed':
      return MANGA_STATE.FINISHED;
    case 'abandoned':
      return MANGA_STATE.ABANDONED;
    case 'paused':
    case 'frozen':
      return MANGA_STATE.PAUSED;
    default:
      return null;
  }
};

/** `pegiRating` per the site's own OpenAPI spec (https://wamanga.ru/api/docs-json): one of
 *  3+ | 6+ | 12+ | 16+ | 18+. `isAdult` overrides it — a title can be flagged adult regardless
 *  of a lower pegi tier. */
const parseContentRating = (jo: { isAdult?: boolean; pegiRating?: string }): RawContentRating => {
  if (jo.isAdult) return CONTENT_RATING.ADULT;
  switch (jo.pegiRating) {
    case '3+':
    case '6+':
      return CONTENT_RATING.SAFE;
    case '12+':
    case '16+':
      return CONTENT_RATING.SUGGESTIVE;
    case '18+':
      return CONTENT_RATING.ADULT;
    default:
      return CONTENT_RATING.SAFE;
  }
};

/** `type` per the site's own OpenAPI spec: manga | manhwa | manhua | comic | manuscript. */
const parseMangaType = (raw: string | undefined): RawMangaType | null => {
  switch (raw) {
    case 'manga':
      return MANGA_TYPE.MANGA;
    case 'manhwa':
      return MANGA_TYPE.MANHWA;
    case 'manhua':
      return MANGA_TYPE.MANHUA;
    case 'comic':
      return MANGA_TYPE.COMICS;
    case 'manuscript':
      return MANGA_TYPE.OTHER;
    default:
      return null;
  }
};

const parseTags = (jo: { genres?: string[] }): RawTag[] => {
  const seen = new Set<string>();
  const tags: RawTag[] = [];
  for (const name of jo.genres ?? []) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    tags.push({ title: toTitleCase(name), key: name, source: SOURCE_ID });
  }
  return tags;
};

const collectAltTitles = (jo: MangaJson): string[] => {
  const result: string[] = [];
  if (jo.titleEnglish) result.push(jo.titleEnglish);
  for (const t of jo.alternateTitles ?? []) {
    if (t) result.push(t);
  }
  return [...new Set(result)];
};

/**
 * `sortKey`/`sortDescending` per the site's own OpenAPI spec (https://wamanga.ru/api/docs-json):
 * sortKey ∈ createdAt | updatedAt | publicDate | views | likes | alphabetical. `updatedAt` desc is
 * what the site's homepage `freshUpdates` block is built from, so it's the default here — the
 * upstream default (`alphabetical`) pins the catalog to the same "100 девушек..." first page forever.
 * `likes` is deliberately unmapped: the API accepts it but returns alphabetical order for it.
 */
const getSortKey = (order: string | undefined): { key: string; descending: boolean } => {
  switch (order) {
    case SORT_ORDER.ALPHABETICAL:
      return { key: 'alphabetical', descending: false };
    case SORT_ORDER.NEWEST:
      return { key: 'createdAt', descending: true };
    case SORT_ORDER.POPULARITY:
      return { key: 'views', descending: true };
    default:
      return { key: 'updatedAt', descending: true };
  }
};

const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * types/statuses/translationStatuses/pegiRatings are OpenAPI `array` query params — Nest's default
 * query-array binding, a repeated bare key (`types=manga&types=manhwa`), not a comma-joined string.
 * releaseYearFrom/releaseYearTo are the only RANGE-shaped params the API exposes. The API also
 * accepts a free-text `genres` param, but there's no endpoint to enumerate it and the site's own
 * catalog UI never surfaces a genre filter either — left out here rather than shipping an
 * unenumerable filter the client couldn't render as anything but a text box.
 */
const applyFilterParams = (url: URL, filters: FilterSelection[] | undefined): void => {
  if (!filters || filters.length === 0) return;
  for (const filter of filters) {
    if ('range' in filter) {
      if (filter.range.min != null)
        url.searchParams.set('releaseYearFrom', String(filter.range.min));
      if (filter.range.max != null) url.searchParams.set('releaseYearTo', String(filter.range.max));
      continue;
    }
    switch (filter.groupId) {
      case WAMANGA_FILTER_GROUP.TYPE:
        url.searchParams.append('types', filter.key);
        break;
      case WAMANGA_FILTER_GROUP.STATUS:
        url.searchParams.append('statuses', filter.key);
        break;
      case WAMANGA_FILTER_GROUP.TRANSLATION_STATUS:
        url.searchParams.append('translationStatuses', filter.key);
        break;
      case WAMANGA_FILTER_GROUP.AGE_RATING:
        url.searchParams.append('pegiRatings', filter.key);
        break;
    }
  }
};

export const createWaMangaParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const apiUrl = `https://${domain}/api/v1`;

  const parseManga = (jo: MangaJson): RawManga => {
    return {
      id: generateUid(SOURCE_ID, jo.id),
      title: jo.title,
      altTitles: collectAltTitles(jo),
      url: jo.id,
      publicUrl: `https://${domain}/manga/${jo.slug}`,
      // The site has no bounded 0..10 rating axis, only an unbounded "likes" tally — see
      // RawManga.likes doc on why the two can't be merged.
      rating: RATING_UNKNOWN,
      contentRating: parseContentRating(jo),
      coverUrl: jo.coverUrl ? toAbsoluteUrl(jo.coverUrl, domain) : null,
      largeCoverUrl: jo.imageUrl ? toAbsoluteUrl(jo.imageUrl, domain) : null,
      tags: parseTags(jo),
      state: parseState(jo.statusTitle),
      authors: jo.authors ?? [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(jo.type),
      year: jo.year ?? null,
      likes: jo.likes ?? null,
    };
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, async (page) => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL(`${apiUrl}/manga`);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      const sort = getSortKey(params.order);
      url.searchParams.set('sortKey', sort.key);
      url.searchParams.set('sortDescending', String(sort.descending));
      if (params.query) url.searchParams.set('query', params.query);
      applyFilterParams(url, params.filters);
      const items = await ctx.http.getJson<MangaJson[]>(url.toString());
      return items.map(parseManga);
    });
  };

  const getFilters = (): Promise<RawFilterGroup[]> => {
    const currentYear = new Date().getFullYear();
    return Promise.resolve([
      {
        id: WAMANGA_FILTER_GROUP.TYPE,
        title: 'Тип тайтла',
        type: FILTER_TYPE.CHECKBOX,
        options: TYPE_OPTIONS,
      },
      {
        id: WAMANGA_FILTER_GROUP.STATUS,
        title: 'Статус тайтла',
        type: FILTER_TYPE.CHECKBOX,
        options: STATUS_OPTIONS,
      },
      {
        id: WAMANGA_FILTER_GROUP.TRANSLATION_STATUS,
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX,
        options: STATUS_OPTIONS,
      },
      {
        id: WAMANGA_FILTER_GROUP.AGE_RATING,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: PEGI_RATING_OPTIONS,
      },
      {
        id: WAMANGA_FILTER_GROUP.RELEASE_YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: YEAR_RANGE_MIN, max: currentYear, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(YEAR_RANGE_MIN, currentYear, YEAR_RANGE_CUTOFF),
        },
      },
    ]);
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const [jo, chaptersJson] = await Promise.all([
      ctx.http.getJson<MangaJson>(`${apiUrl}/manga/${mangaUrl}`),
      ctx.http.getJson<ChapterJson[]>(`${apiUrl}/manga/${mangaUrl}/chapters`),
    ]);

    const scanlator =
      (jo.teams ?? [])
        .map((t) => t.name)
        .filter((n): n is string => !!n)
        .join(', ') || null;

    const chapters: RawChapter[] = chaptersJson.map((ch) => ({
      id: generateUid(SOURCE_ID, ch.id),
      url: ch.id,
      title: ch.title && ch.title.length > 0 ? ch.title : null,
      number: ch.position ?? 0,
      volume: 0,
      scanlator,
      uploadDate: parseIsoDate(ch.createdAt),
      branch: null,
      source: SOURCE_ID,
    }));

    return {
      ...parseManga(jo),
      description: jo.description ?? null,
      chapters,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const json = await ctx.http.getJson<{ files: PageFileJson[] }>(
      `${apiUrl}/chapters/${chapterUrl}`,
    );
    return json.files.map((file) => {
      const url = toAbsoluteUrl(file.diskFile, domain);
      return { id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID };
    });
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'WaManga',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        SORT_ORDER.UPDATED,
        SORT_ORDER.NEWEST,
        SORT_ORDER.POPULARITY,
        SORT_ORDER.ALPHABETICAL,
      ],
      supportsDirection: false,
      isSearchSupported: true,
      isMultipleTagsSupported: false,
      isFiltersSupported: true,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

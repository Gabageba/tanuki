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
  type TitleType,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import { getYearRangePresets } from '../../core/filters/range-presets';
import { FILTER_GROUP } from '../../core/filters/group';
import { buildSearchFilters, type SearchFilterSpec } from '../../core/filters/searchFilters';
import type {
  RawTitle,
  RawChapter,
  RawContentRating,
  RawFilterGroup,
  RawFilterOption,
  RawTitleType,
  RawPage,
  RawTag,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';
import { toHomeSections } from '../../core/home';

const SOURCE_ID = CATALOG_SOURCE_ID.WAMANGA;

/** Блоки главной wamanga.ru — `/api/v1/manga/homepage` отдаёт их разом, в форме элементов
 *  каталога (проверено вживую 2026-10-12). «Онгоинг» на странице — метка статуса, не блок. */
export const WAMANGA_HOME_SECTION = {
  DAY_TOP: 'dayTop',
  NEW: 'new',
  FRESH_UPDATES: 'freshUpdates',
} as const;

const WAMANGA_HOME_SECTIONS = [
  { id: WAMANGA_HOME_SECTION.DAY_TOP, title: 'Топ за день', kind: HOME_SECTION_KIND.TOP },
  { id: WAMANGA_HOME_SECTION.NEW, title: 'Новинки', kind: HOME_SECTION_KIND.NEW },
  {
    id: WAMANGA_HOME_SECTION.FRESH_UPDATES,
    title: 'Свежие обновления',
    kind: HOME_SECTION_KIND.UPDATES,
  },
];
const PAGE_SIZE = 20;
const YEAR_RANGE_MIN = 1990;
const YEAR_RANGE_CUTOFF = 2000;
const URL_DELIMITER = ',,';

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

type ChapterJson = {
  id: string;
  position?: number;
  title?: string;
  createdAt?: string;
};

type HomepageJson = {
  dayTop?: MangaJson[];
  latestPublished?: MangaJson[];
  freshUpdates?: MangaJson[];
};

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
  translationStatus?: string;
  authors?: string[];
  artists?: string[];
  publishers?: string[];
  isAdult?: boolean;
  description?: string;
  teams?: { name?: string }[];
  year?: number;
  type?: string;
  pegiRating?: string;
  likes?: number;
  views?: number;
  createdAt?: string;
};

/** `/manga/get/{type}/{slug}?chapters=true` is the site's own manga-page endpoint (it doubles as
 *  view-count tracking) and, verified live, is the only one that carries likes/views/teams and the
 *  full chapter list together — `/manga/{id}` and `/manga/{id}/additional` each expose only part of
 *  that set. Using it for getDetails means one request instead of two, and it's why RawTitle.url
 *  is built from `type,,slug` rather than the bare id the list endpoint also returns. */
type MangaDetailsJson = MangaJson & {
  chapters?: ChapterJson[];
};

type PageFileJson = {
  diskFile: string;
};

const parseState = (status: string | undefined): TitleState | null => {
  switch (status?.toLowerCase()) {
    case 'ongoing':
      return TITLE_STATE.ONGOING;
    case 'finished':
    case 'completed':
      return TITLE_STATE.FINISHED;
    case 'abandoned':
      return TITLE_STATE.ABANDONED;
    case 'paused':
    case 'frozen':
      return TITLE_STATE.PAUSED;
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
const parseMangaType = (raw: string | undefined): RawTitleType | null => {
  switch (raw) {
    case 'manga':
      return TITLE_TYPE.MANGA;
    case 'manhwa':
      return TITLE_TYPE.MANHWA;
    case 'manhua':
      return TITLE_TYPE.MANHUA;
    case 'comic':
      return TITLE_TYPE.COMICS;
    case 'manuscript':
      return TITLE_TYPE.OTHER;
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

/** `teams` is only carried by the details endpoint, so this returns [] for list items — same
 *  shape scanlator (below, per-chapter) is built from. */
const parseTranslators = (teams: { name?: string }[] | undefined): string[] => {
  return [...new Set((teams ?? []).map((t) => t.name).filter((n): n is string => !!n))];
};

/**
 * `sortKey`/`sortDescending` per the site's own OpenAPI spec (https://wamanga.ru/api/docs-json):
 * sortKey ∈ createdAt | updatedAt | publicDate | views | likes | alphabetical. `updatedAt` desc is
 * what the site's homepage `freshUpdates` block is built from, so it's the default here — the
 * upstream default (`alphabetical`) pins the catalog to the same "100 девушек..." first page forever.
 * `createdAt` (added to the catalog) is ADDED, `publicDate` (the title's own release date) is
 * RELEASED — same split other sources draw between the two.
 *
 * `likes` is mapped to LIKES for parity with the site's own sort dropdown, but verified live it's
 * server-side broken — the API silently returns alphabetical order for it regardless of
 * `sortDescending`, never actual likes order. Kept anyway so the option isn't missing where the
 * site itself offers it; not something fixable from here.
 *
 * Verified live: `sortDescending` is genuinely respected for createdAt/publicDate/views/alphabetical,
 * but the API silently ignores it for `updatedAt` (any truthy/falsy value returns the same desc
 * order) — a site-side bug, not something fixable from here. That's the UPDATED/default sort, so
 * toggling direction while on the default sort will look like a no-op; every other sort order does
 * react to it.
 */
const getSortKey = (
  order: string | undefined,
  direction: string | undefined,
): { key: string; descending: boolean } => {
  const { key, descending } = ((): { key: string; descending: boolean } => {
    switch (order) {
      case SORT_ORDER.ALPHABETICAL:
        return { key: 'alphabetical', descending: false };
      case SORT_ORDER.ADDED:
        return { key: 'createdAt', descending: true };
      case SORT_ORDER.RELEASED:
        return { key: 'publicDate', descending: true };
      case SORT_ORDER.POPULARITY:
        return { key: 'views', descending: true };
      case SORT_ORDER.LIKES:
        return { key: 'likes', descending: true };
      default:
        return { key: 'updatedAt', descending: true };
    }
  })();
  if (direction === SORT_DIRECTION.ASC) return { key, descending: false };
  if (direction === SORT_DIRECTION.DESC) return { key, descending: true };
  return { key, descending };
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

const getWaMangaTypeKeys = (value: TitleType): string[] => {
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
      return ['manuscript'];
  }
};

const getWaMangaStateKeys = (value: TitleState): string[] => {
  switch (value) {
    case TITLE_STATE.ONGOING:
      return ['ongoing'];
    case TITLE_STATE.FINISHED:
      return ['completed'];
    case TITLE_STATE.PAUSED:
      return ['hiatus'];
    case TITLE_STATE.ABANDONED:
      return ['abandoned'];
    case TITLE_STATE.UPCOMING:
      return ['announced'];
  }
};

/** Search criteria -> this source's own filter groups (see resolveSearchFilters). */
const SEARCH_FILTER_SPEC: SearchFilterSpec = {
  types: { groupId: WAMANGA_FILTER_GROUP.TYPE, isMultiple: true, getKeys: getWaMangaTypeKeys },
  states: { groupId: WAMANGA_FILTER_GROUP.STATUS, isMultiple: true, getKeys: getWaMangaStateKeys },
};

export const createWaMangaParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const apiUrl = `https://${domain}/api/v1`;

  const parseManga = (jo: MangaJson): RawTitle => {
    return {
      id: generateUid(SOURCE_ID, jo.id),
      title: jo.title,
      altTitles: collectAltTitles(jo),
      // The list endpoint only ever hands out the bare id, but getDetails needs type+slug to hit
      // the one endpoint that carries likes/views/teams/chapters together — see MangaDetailsJson.
      url: `${jo.type}${URL_DELIMITER}${jo.slug}`,
      publicUrl: `https://${domain}/manga/${jo.slug}`,
      // The site has no bounded 0..10 rating axis, only an unbounded "likes" tally — see
      // RawTitle.likes doc on why the two can't be merged.
      rating: RATING_UNKNOWN,
      contentRating: parseContentRating(jo),
      coverUrl: jo.coverUrl ? toAbsoluteUrl(jo.coverUrl, domain) : null,
      largeCoverUrl: jo.imageUrl ? toAbsoluteUrl(jo.imageUrl, domain) : null,
      tags: parseTags(jo),
      releaseState: parseState(jo.statusTitle),
      // translationStatus shares the same seven-value enum as statusTitle (see STATUS_OPTIONS),
      // so the same mapper applies to both.
      translationState: parseState(jo.translationStatus),
      authors: jo.authors ?? [],
      artists: jo.artists ?? [],
      publishers: jo.publishers ?? [],
      translators: parseTranslators(jo.teams),
      description: jo.description ?? null,
      chapters: null,
      source: SOURCE_ID,
      type: parseMangaType(jo.type),
      year: jo.year ?? null,
      likes: jo.likes ?? null,
      views: jo.views ?? null,
      addedAt: parseIsoDate(jo.createdAt),
    };
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, async (page) => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL(`${apiUrl}/manga`);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      const sort = getSortKey(params.order, params.direction);
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

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const [type, slug] = mangaUrl.split(URL_DELIMITER);
    const jo = await ctx.http.getJson<MangaDetailsJson>(
      `${apiUrl}/manga/get/${type}/${slug}?chapters=true`,
    );

    const scanlator =
      (jo.teams ?? [])
        .map((t) => t.name)
        .filter((n): n is string => !!n)
        .join(', ') || null;

    const chapters: RawChapter[] = (jo.chapters ?? []).map((ch) => ({
      id: generateUid(SOURCE_ID, ch.id),
      url: ch.id,
      title: ch.title && ch.title.length > 0 ? ch.title : null,
      number: ch.position ?? null,
      volume: null,
      scanlator,
      uploadDate: parseIsoDate(ch.createdAt),
      branch: null,
      source: SOURCE_ID,
    }));

    return {
      ...parseManga(jo),
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

  const getHome = async () => {
    const json = await ctx.http.getJson<HomepageJson>(`${apiUrl}/manga/homepage`);
    return toHomeSections(WAMANGA_HOME_SECTIONS, {
      [WAMANGA_HOME_SECTION.DAY_TOP]: (json.dayTop ?? []).map(parseManga),
      [WAMANGA_HOME_SECTION.NEW]: (json.latestPublished ?? []).map(parseManga),
      [WAMANGA_HOME_SECTION.FRESH_UPDATES]: (json.freshUpdates ?? []).map(parseManga),
    });
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'WaManga',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.ALPHABETICAL,
        SORT_ORDER.LIKES,
        SORT_ORDER.ADDED,
        SORT_ORDER.UPDATED,
        SORT_ORDER.RELEASED,
      ],
      supportsDirection: true,
      isSearchSupported: true,
      isMultipleTagsSupported: false,
      isFiltersSupported: true,
      isSearchWithFiltersSupported: true,
      homeSections: WAMANGA_HOME_SECTIONS,
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

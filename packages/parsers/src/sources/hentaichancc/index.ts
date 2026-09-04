import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { FILTER_GROUP } from '../../core/filters/group';
import { getYearRangePresets } from '../../core/filters/range-presets';
import type {
  RawManga,
  RawChapter,
  RawFilterGroup,
  RawFilterOption,
  RawMangaType,
  RawPage,
  RawTag,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.HENTAICHAN_CC;
/**
 * Not a domain the source config discovers dynamically — the site's Next.js frontend
 * (`ctx.domain`, used only for publicUrl/Referer) calls this Directus instance from the
 * browser, found via the frontend's `Content-Security-Policy: connect-src` header. It's a
 * fully public, unauthenticated API (no cf_clearance/API key needed, verified live) that
 * back-ends the whole catalog, unlike the Next.js pages themselves which only server-render
 * filter metadata, not the manga grid.
 */
const API_BASE = 'https://backend.hentaichan.cc';
/**
 * Not `${API_BASE}/assets/<uuid>` — that hits the Directus origin directly and measured
 * ~1.6-2s per image live (TTFB), vs ~0.7-1.1s and falling on repeat hits through this edge
 * (the same host the site's own frontend hotlinks images from, confirmed live). Needs the
 * file's extension, which `filename_disk` below supplies for free in the same query.
 */
const CDN_BASE = 'https://cdn.hentaichan.cc';
/** id and slug are both needed — id to query chapters/details, slug to rebuild publicUrl. */
const URL_DELIMITER = ',,';

export const HENTAICHAN_CC_FILTER_GROUP = {
  TAG: FILTER_GROUP.TAG,
  TYPE: FILTER_GROUP.TYPE,
  SERIES: FILTER_GROUP.SERIES,
  AUTHOR: FILTER_GROUP.AUTHOR,
  TRANSLATOR: FILTER_GROUP.TRANSLATOR,
  VIEWS: FILTER_GROUP.VIEWS,
  LIKES: FILTER_GROUP.LIKES,
  PAGES: FILTER_GROUP.PAGES,
  YEAR: FILTER_GROUP.YEAR,
} as const;

/** `type` is a plain enum field on the manga collection itself (not a relation) — verified live
 *  via Directus `groupBy[]=type`: manga | doujinshi | comix, nothing else. */
const TYPE_OPTIONS: RawFilterOption[] = [
  { key: 'manga', title: 'Манга', count: null },
  { key: 'doujinshi', title: 'Додзинси', count: null },
  { key: 'comix', title: 'Комикс', count: null },
];

/** Fields the numeric/date RANGE groups below read live bounds from — collected in one aggregate
 *  request per `fetchFilters()` call. `date_created` (upload date, the only date the collection
 *  has) doubles as the YEAR bound source: there's no separate "year of the original work" field. */
const RANGE_AGGREGATE_FIELDS = 'date_created,views,likes,pages';

type RangeAggregateBounds = {
  date_created: string;
  views: number;
  likes: number;
  pages: number;
};

type DirectusListResponse<T> = {
  data: T[];
};
type DirectusItemResponse<T> = {
  data: T | null;
};

type FileRef = {
  filename_disk: string | null;
};

/** Directus `type` enum verified live via `groupBy[]=type`: manga | doujinshi | comix, nothing
 *  else — same three values as TYPE_OPTIONS above. */
type HentaichanMangaType = 'manga' | 'doujinshi' | 'comix';

type MangaListItem = {
  id: number;
  name: string;
  slug: string;
  cover: FileRef | null;
  description: string | null;
  tags: TagRef[];
  type: HentaichanMangaType;
  likes: number;
  pages: number;
  date_created: string;
};

type TagRef = {
  tags_id: { name: string; slug: string } | null;
};
type AuthorRef = {
  authors_id: { name: string | null } | null;
};

type MangaDetail = {
  id: number;
  name: string;
  slug: string;
  cover: FileRef | null;
  description: string | null;
  russian_name: string | null;
  english_name: string | null;
  romaji_name: string | null;
  tags: TagRef[];
  authors: AuthorRef[];
  type: HentaichanMangaType;
  likes: number;
  pages: number;
  date_created: string;
};

/** Shape shared by tags/series/authors/translators — each a plain Directus collection with just
 *  a display name and a slug used as the filter key. */
type NamedDictionaryItem = {
  name: string;
  slug: string;
};

type ChapterListItem = {
  id: number;
};
type ChapterPages = {
  pages: { directus_files_id: FileRef | null }[];
};

const assetUrl = (file: FileRef | null): string | null => {
  return file?.filename_disk ? `${CDN_BASE}/${file.filename_disk}` : null;
};

/** No dedicated MANGA_TYPE bucket for dōjinshi — it's still hand-drawn manga-style art, so it
 *  folds into MANGA the same way the site's own "Манга"/"Додзинси" split doesn't map onto the
 *  frontend's format enum. `comix` is the one value with an exact match. */
const mangaTypeFor = (type: HentaichanMangaType): RawMangaType => {
  switch (type) {
    case 'manga':
      return MANGA_TYPE.MANGA;
    case 'doujinshi':
      return MANGA_TYPE.MANGA;
    case 'comix':
      return MANGA_TYPE.COMICS;
  }
};

const sortFieldFor = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.POPULARITY:
      return 'views';
    case SORT_ORDER.RATING:
      return 'likes';
    case SORT_ORDER.PAGES:
      return 'pages';
    /** Not exposed as its own control on the site's catalog UI (its sort dropdown only offers
     *  date_created/likes/views/pages, verified live in the bundled catalog chunk), but the field
     *  exists on the backend and reorders results very differently from `date_created` — a manga
     *  edited/republished long after upload jumps to the top, verified live (`sort=-date_updated`
     *  surfaced a manga created 2025-04-14 ahead of ones created in 2026-09). */
    case SORT_ORDER.UPDATED:
      return 'date_updated';
    default:
      return 'date_created';
  }
};

/** Directus takes direction as a `-` prefix on the field, not a separate param — verified live
 *  that `sort=<field>` and `sort=-<field>` both work for every field used below. */
const sortFor = (order: string | undefined, direction: string | undefined): string => {
  const field = sortFieldFor(order);
  return direction === SORT_DIRECTION.ASC ? field : `-${field}`;
};

/** m2m relation groups: server field is `filter[<collection>][<collection>_id][slug][_in]`, same
 *  junction alias (`<name>_id`) Directus generated for every one of these relations — verified
 *  live for tags/series/authors/translators alike. */
const RELATION_FILTER_KEY: Partial<Record<string, string>> = {
  [HENTAICHAN_CC_FILTER_GROUP.TAG]: 'filter[tags][tags_id][slug][_in]',
  [HENTAICHAN_CC_FILTER_GROUP.SERIES]: 'filter[series][series_id][slug][_in]',
  [HENTAICHAN_CC_FILTER_GROUP.AUTHOR]: 'filter[authors][authors_id][slug][_in]',
  [HENTAICHAN_CC_FILTER_GROUP.TRANSLATOR]: 'filter[translators][translators_id][slug][_in]',
};

/** Plain scalar columns a RANGE group maps onto — `date_created` (YEAR) isn't here since it needs
 *  its bounds turned into Jan 1 .. Dec 31 dates instead of the bare number the server would reject. */
const RANGE_FILTER_FIELD: Partial<Record<string, string>> = {
  [HENTAICHAN_CC_FILTER_GROUP.VIEWS]: 'views',
  [HENTAICHAN_CC_FILTER_GROUP.LIKES]: 'likes',
  [HENTAICHAN_CC_FILTER_GROUP.PAGES]: 'pages',
};

/** Directus's `_in` operator takes one comma-joined value, not a repeated bare key — several
 *  selections in the same group collapse into one query entry, same OR semantics a repeated key
 *  gives on other sources. Every relation/scalar filter here verified live to combine (AND) with
 *  every other one, same as any two independent Directus filters. */
const buildFilterParams = (filters: FilterSelection[] | undefined): Record<string, string> => {
  const params: Record<string, string> = {};
  if (!filters || filters.length === 0) return params;
  const relationKeys: Partial<Record<string, string[]>> = {};
  for (const filter of filters) {
    if ('range' in filter) {
      if (filter.groupId === HENTAICHAN_CC_FILTER_GROUP.YEAR) {
        if (filter.range.min != null)
          params['filter[date_created][_gte]'] = `${filter.range.min}-01-01`;
        if (filter.range.max != null)
          params['filter[date_created][_lte]'] = `${filter.range.max}-12-31`;
        continue;
      }
      const field = RANGE_FILTER_FIELD[filter.groupId];
      if (!field) continue;
      if (filter.range.min != null) params[`filter[${field}][_gte]`] = String(filter.range.min);
      if (filter.range.max != null) params[`filter[${field}][_lte]`] = String(filter.range.max);
      continue;
    }
    if (filter.groupId === HENTAICHAN_CC_FILTER_GROUP.TYPE) {
      const existing = params['filter[type][_in]'];
      params['filter[type][_in]'] = existing ? `${existing},${filter.key}` : filter.key;
      continue;
    }
    const key = RELATION_FILTER_KEY[filter.groupId];
    if (!key) continue;
    (relationKeys[key] ??= []).push(filter.key);
  }
  for (const [key, keys] of Object.entries(relationKeys)) {
    params[key] = keys!.join(',');
  }
  return params;
};

export const createHentaichanCcParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  const directusGet = async <T>(path: string, params: Record<string, string>): Promise<T> => {
    const url = `${API_BASE}${path}?${new URLSearchParams(params).toString()}`;
    return ctx.http.getJson<T>(url);
  };

  const parseListItem = (item: MangaListItem): RawManga => {
    const cover = assetUrl(item.cover);
    const tags: RawTag[] = item.tags
      .map((t) => t.tags_id)
      .filter((t): t is { name: string; slug: string } => !!t)
      .map((t) => ({ title: toTitleCase(t.name), key: t.slug, source: SOURCE_ID }));
    return {
      id: generateUid(SOURCE_ID, item.id),
      title: item.name,
      altTitles: [],
      url: [item.id, item.slug].join(URL_DELIMITER),
      publicUrl: `https://${domain}/manga/${item.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: cover,
      largeCoverUrl: cover,
      tags,
      state: null,
      authors: [],
      description: item.description,
      chapters: null,
      source: SOURCE_ID,
      type: mangaTypeFor(item.type),
      year: new Date(item.date_created).getFullYear(),
      likes: item.likes,
      pages: item.pages,
    };
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    const query: Record<string, string> = {
      limit: String(params.limit),
      offset: String(params.offset),
      sort: sortFor(params.order, params.direction),
      fields:
        'id,name,slug,cover.filename_disk,description,type,likes,pages,date_created,' +
        'tags.tags_id.name,tags.tags_id.slug',
      /** Excludes 4 live test/junk rows ("test", "1233", ...) sitting in `declined`/`moderation`
       *  status — verified live, never approved catalog entries a listing (filtered or not)
       *  should surface. */
      'filter[status][_nin]': 'declined,moderation',
    };
    if (params.query?.trim()) query['search'] = params.query.trim();
    Object.assign(query, buildFilterParams(params.filters));
    const res = await directusGet<DirectusListResponse<MangaListItem>>('/items/manga', query);
    return res.data.map(parseListItem);
  };

  const parseMangaUrl = (url: string): { mangaId: string; slug: string } => {
    const [mangaId, slug] = url.split(URL_DELIMITER);
    if (!mangaId || !slug) throw new ParseError(`Cannot parse manga url: ${url}`, SOURCE_ID);
    return { mangaId, slug };
  };

  /**
   * Each catalog entry here is a standalone release (a oneshot or a single translated chapter,
   * not a whole ongoing series) — live check against backend.hentaichan.cc shows 7035 of 7036
   * manga rows carry `chapters: 1`. `id` ordering (not `chapter_id`, which is near-always `1`
   * even across a manga's own multiple rows) is the only reliable upload order.
   */
  const fetchChapters = async (mangaId: string): Promise<RawChapter[]> => {
    const res = await directusGet<DirectusListResponse<ChapterListItem>>('/items/chapters', {
      'filter[manga][_eq]': mangaId,
      sort: 'id',
      fields: 'id',
    });
    return res.data.map((ch, index) => ({
      id: generateUid(SOURCE_ID, ch.id),
      title: null,
      number: index + 1,
      volume: 0,
      url: String(ch.id),
      scanlator: null,
      uploadDate: 0,
      branch: null,
      source: SOURCE_ID,
    }));
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const { mangaId, slug } = parseMangaUrl(mangaUrl);
    const [detailRes, chapters] = await Promise.all([
      directusGet<DirectusListResponse<MangaDetail>>('/items/manga', {
        'filter[id][_eq]': mangaId,
        limit: '1',
        fields:
          'id,name,slug,cover.filename_disk,description,russian_name,english_name,romaji_name,' +
          'type,likes,pages,date_created,' +
          'tags.tags_id.name,tags.tags_id.slug,authors.authors_id.name',
      }),
      fetchChapters(mangaId),
    ]);
    const info = detailRes.data[0];
    if (!info) throw new ParseError(`Manga not found: ${mangaUrl}`, SOURCE_ID);

    const altTitles = [info.russian_name, info.english_name, info.romaji_name]
      .filter((t): t is string => !!t && t !== info.name)
      .filter((t, i, arr) => arr.indexOf(t) === i);

    const tags: RawTag[] = info.tags
      .map((t) => t.tags_id)
      .filter((t): t is { name: string; slug: string } => !!t)
      .map((t) => ({ title: toTitleCase(t.name), key: t.slug, source: SOURCE_ID }));

    const authors = [
      ...new Set(info.authors.map((a) => a.authors_id?.name).filter((n): n is string => !!n)),
    ];

    const cover = assetUrl(info.cover);

    return {
      id: generateUid(SOURCE_ID, info.id),
      title: info.name,
      altTitles,
      url: mangaUrl,
      publicUrl: `https://${domain}/manga/${slug}`,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: cover,
      largeCoverUrl: cover,
      tags,
      state: null,
      authors,
      description: info.description,
      chapters,
      source: SOURCE_ID,
      type: mangaTypeFor(info.type),
      year: new Date(info.date_created).getFullYear(),
      likes: info.likes,
      pages: info.pages,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const res = await directusGet<DirectusItemResponse<ChapterPages>>(
      `/items/chapters/${chapterUrl}`,
      { fields: 'id,pages.directus_files_id.filename_disk' },
    );
    const pages = res.data?.pages ?? [];
    return pages
      .map((p) => assetUrl(p.directus_files_id))
      .filter((url): url is string => !!url)
      .map((url) => ({ id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID }));
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  /** No aggregate title-count per option: at up to ~2500 authors, that's thousands of extra
   *  requests just to fill in a number the UI doesn't strictly need — `count: null` is what every
   *  other live-fetched dictionary group (e.g. remanga's genres/categories) already sends.
   *  `series`/`authors` carry a few live `moderation` rows same as `manga` does (verified: 15
   *  authors, 1 series) — excluded the same way, `translators` has no such status field at all. */
  const fetchDictionary = async (
    collection: string,
    onlyPublished: boolean,
  ): Promise<RawFilterOption[]> => {
    const params: Record<string, string> = { limit: '-1', sort: 'name', fields: 'name,slug' };
    if (onlyPublished) params['filter[status][_eq]'] = 'published';
    const res = await directusGet<DirectusListResponse<NamedDictionaryItem>>(
      `/items/${collection}`,
      params,
    );
    return res.data.map((t) => ({ key: t.slug, title: toTitleCase(t.name), count: null }));
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const [tags, series, authors, translators, boundsRes] = await Promise.all([
      fetchDictionary('tags', false),
      fetchDictionary('series', true),
      fetchDictionary('authors', true),
      fetchDictionary('translators', false),
      directusGet<DirectusListResponse<{ min: RangeAggregateBounds; max: RangeAggregateBounds }>>(
        '/items/manga',
        { 'aggregate[min]': RANGE_AGGREGATE_FIELDS, 'aggregate[max]': RANGE_AGGREGATE_FIELDS },
      ),
    ]);
    const bounds = boundsRes.data[0]!;
    const minYear = new Date(bounds.min.date_created).getFullYear();
    const maxYear = new Date(bounds.max.date_created).getFullYear();

    return [
      {
        id: HENTAICHAN_CC_FILTER_GROUP.TAG,
        title: 'Теги',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX,
        options: tags,
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.TYPE,
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX,
        options: TYPE_OPTIONS,
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.SERIES,
        title: 'Серии',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX,
        options: series,
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.AUTHOR,
        title: 'Авторы',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX,
        options: authors,
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.TRANSLATOR,
        title: 'Переводчики',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX,
        options: translators,
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.VIEWS,
        title: 'Просмотры',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: bounds.min.views, max: bounds.max.views } },
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.LIKES,
        title: 'Лайки',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: bounds.min.likes, max: bounds.max.likes } },
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.PAGES,
        title: 'Страницы',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: { range: { min: bounds.min.pages, max: bounds.max.pages } },
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.YEAR,
        title: 'Год',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: minYear, max: maxYear, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(minYear, maxYear),
        },
      },
    ];
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'HentaiChan',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.HENTAI,
      isBroken: false,
      isAdult: true,
      requiresVpn: true,
      sortOrders: [
        SORT_ORDER.NEWEST,
        SORT_ORDER.UPDATED,
        SORT_ORDER.POPULARITY,
        SORT_ORDER.RATING,
        SORT_ORDER.PAGES,
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

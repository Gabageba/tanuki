import {
  HOME_SECTION_KIND,
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_TYPE,
  RANGE_FORMAT,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  formatCompactNumber,
  type EnumLiteralsOf,
  type FilterRangePreset,
  type HomeSectionVariant,
  SOURCE_LOCALE,
  type TitleType,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { FILTER_GROUP } from '../../core/filters/group';
import { buildSearchFilters, type SearchFilterSpec } from '../../core/filters/searchFilters';
import { getYearRangePresets } from '../../core/filters/range-presets';
import type {
  RawTitle,
  RawChapter,
  RawFilterGroup,
  RawFilterOption,
  RawTitleType,
  RawPage,
  RawTag,
  RawHomeSectionInfo,
  RawHomeSectionPage,
  RawHomeSectionParams,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';
import { toHomeSections } from '../../core/home';
import { parseHtml } from '../../core/html/dom';
import { fetchHentaichanCcBookmarks } from './bookmarks';
import { API_BASE, URL_DELIMITER } from './models';

const SOURCE_ID = CATALOG_SOURCE_ID.HENTAICHAN_CC;
/**
 * Not `${API_BASE}/assets/<uuid>` — that hits the Directus origin directly and measured
 * ~1.6-2s per image live (TTFB), vs ~0.7-1.1s and falling on repeat hits through this edge
 * (the same host the site's own frontend hotlinks images from, confirmed live). Needs the
 * file's extension, which `filename_disk` below supplies for free in the same query.
 */
const CDN_BASE = 'https://cdn.hentaichan.cc';

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

/** Fixed buckets, not derived from the live bounds like YEAR's decades are — `views`/`likes`/`pages`
 *  don't have a natural period to bucket by, so these are just sane quick picks sized off a live
 *  aggregate (max views ~4.4M, likes ~17.5k, pages 100, checked against `backend.hentaichan.cc`). */
const VIEWS_PRESETS: FilterRangePreset[] = [
  { id: 'lt-1000', label: `< ${formatCompactNumber(1000)}`, max: 1000 },
  {
    id: '1000-10000',
    label: `${formatCompactNumber(1000)}-${formatCompactNumber(10000)}`,
    min: 1000,
    max: 10000,
  },
  {
    id: '10000-50000',
    label: `${formatCompactNumber(10000)}-${formatCompactNumber(50000)}`,
    min: 10000,
    max: 50000,
  },
  {
    id: '50000-200000',
    label: `${formatCompactNumber(50000)}-${formatCompactNumber(200000)}`,
    min: 50000,
    max: 200000,
  },
  { id: '200000-plus', label: `${formatCompactNumber(200000)}+`, min: 200000 },
];

const LIKES_PRESETS: FilterRangePreset[] = [
  { id: 'lt-100', label: '< 100', max: 100 },
  { id: '100-1000', label: `100-${formatCompactNumber(1000)}`, min: 100, max: 1000 },
  {
    id: '1000-5000',
    label: `${formatCompactNumber(1000)}-${formatCompactNumber(5000)}`,
    min: 1000,
    max: 5000,
  },
  { id: '5000-plus', label: `${formatCompactNumber(5000)}+`, min: 5000 },
];

/** `pages` is a single release's own page count (verified live max: 100), not a chapter tally, so
 *  it needs its own scale instead of the shared `CHAPTERS_COUNT_PRESETS`. */
const PAGES_PRESETS: FilterRangePreset[] = [
  { id: 'lt-20', label: '< 20', max: 20 },
  { id: '20-40', label: '20-40', min: 20, max: 40 },
  { id: '40-60', label: '40-60', min: 40, max: 60 },
  { id: '60-plus', label: '60+', min: 60 },
];

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
  views: number;
  pages: number;
  date_created: string;
};

type TagRef = {
  tags_id: { name: string; slug: string } | null;
};
type AuthorRef = {
  authors_id: { name: string | null } | null;
};
type TranslatorRef = {
  translators_id: { name: string | null } | null;
};
type SeriesRef = {
  series_id: { name: string | null } | null;
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
  translators: TranslatorRef[];
  series: SeriesRef[];
  type: HentaichanMangaType;
  likes: number;
  views: number;
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

/** No dedicated TITLE_TYPE bucket for dōjinshi — it's still hand-drawn manga-style art, so it
 *  folds into MANGA the same way the site's own "Манга"/"Додзинси" split doesn't map onto the
 *  frontend's format enum. `comix` is the one value with an exact match. */
const mangaTypeFor = (type: HentaichanMangaType): RawTitleType => {
  switch (type) {
    case 'manga':
      return TITLE_TYPE.MANGA;
    case 'doujinshi':
      return TITLE_TYPE.MANGA;
    case 'comix':
      return TITLE_TYPE.COMICS;
  }
};

/** `mangaTypeFor` folds doujinshi into TITLE_TYPE.MANGA — this recovers that distinction as the
 *  release format, the same three labels TYPE_OPTIONS already surfaces as a filter. */
const releaseFormatTitleFor = (type: HentaichanMangaType): string => {
  switch (type) {
    case 'manga':
      return 'Манга';
    case 'doujinshi':
      return 'Додзинси';
    case 'comix':
      return 'Комикс';
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

/** Блоки главной hentaichan.cc — проверено вживую 2026-10-14. «Новая манга» — каталог по дате
 *  добавления, листается как он. «Популярную мангу» сайт собирает сам (ни одна сортировка API её
 *  не повторяет): по пять тайтлов за неделю и за месяц лежат в RSC-данных главной, а сами
 *  тайтлы берутся из API. */
export const HENTAICHAN_CC_HOME_SECTION = {
  NEW: 'new',
  POPULAR: 'popular',
} as const;

/** Вкладки «Популярной манги» — ключи списков в RSC-данных главной. */
const POPULAR_PERIOD = {
  WEEK: 'week',
  MONTH: 'month',
} as const;
type PopularPeriod = EnumLiteralsOf<typeof POPULAR_PERIOD>;

const POPULAR_PERIODS: (HomeSectionVariant & { id: PopularPeriod })[] = [
  { id: POPULAR_PERIOD.WEEK, title: 'За неделю' },
  { id: POPULAR_PERIOD.MONTH, title: 'За месяц' },
];

const HENTAICHAN_CC_HOME_SECTIONS: RawHomeSectionInfo[] = [
  { id: HENTAICHAN_CC_HOME_SECTION.NEW, title: 'Новая манга', kind: HOME_SECTION_KIND.NEW },
  {
    id: HENTAICHAN_CC_HOME_SECTION.POPULAR,
    title: 'Популярная манга',
    kind: HOME_SECTION_KIND.POPULAR,
    variants: POPULAR_PERIODS,
  },
];

/** Пропсы клиентского слайдера «Популярной манги» в RSC-данных главной. */
type PopularSliderProps = Partial<Record<PopularPeriod, { slug: string }[]>>;

/** RSC-данные Next.js — строки `self.__next_f.push([1, "<кусок>"])`; кусок может оборваться
 *  посреди записи, поэтому склеиваются все. */
const NEXT_FLIGHT_PREFIX = 'self.__next_f.push(';

/**
 * Slug'и «Популярной манги» за период в порядке сайта. В разметке есть только активная вкладка
 * (неделя) — месяц приходит лишь в RSC-данных, поэтому оба периода берутся оттуда: запись вида
 * `3e:["$","$L6a",null,{"week":[…],"month":[…]}]`, одна на строку.
 */
const parsePopularSlugs = (html: string, period: PopularPeriod): string[] => {
  const doc = parseHtml(html, '');
  const flight = doc
    .$('script')
    .toArray()
    .map((el) => doc.$(el).text().trim())
    .filter((text) => text.startsWith(NEXT_FLIGHT_PREFIX))
    .map((text) => {
      const [, chunk] = JSON.parse(text.slice(NEXT_FLIGHT_PREFIX.length, -1)) as [number, unknown];
      return typeof chunk === 'string' ? chunk : '';
    })
    .join('');
  for (const line of flight.split('\n')) {
    if (!line.includes(`"${POPULAR_PERIOD.WEEK}":[`)) continue;
    const row = JSON.parse(line.slice(line.indexOf(':') + 1)) as unknown[];
    const props = row[3] as PopularSliderProps | undefined;
    const items = props?.[period];
    if (items) return [...new Set(items.map(({ slug }) => slug))];
  }
  return [];
};

const HOME_SECTION_SIZE = 20;

/** Поля элемента списка — общие у каталога и главной. */
const LIST_FIELDS =
  'id,name,slug,cover.filename_disk,description,type,likes,views,pages,date_created,' +
  'tags.tags_id.name,tags.tags_id.slug';

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

const getHentaichanCcTypeKeys = (value: TitleType): string[] => {
  switch (value) {
    case TITLE_TYPE.MANGA:
      return ['manga', 'doujinshi'];
    case TITLE_TYPE.MANHWA:
      return [];
    case TITLE_TYPE.MANHUA:
      return [];
    case TITLE_TYPE.COMICS:
      return ['comix'];
    case TITLE_TYPE.OTHER:
      return [];
  }
};

/** Search criteria -> this source's own filter groups (see resolveSearchFilters). */
const SEARCH_FILTER_SPEC: SearchFilterSpec = {
  types: {
    groupId: HENTAICHAN_CC_FILTER_GROUP.TYPE,
    isMultiple: true,
    getKeys: getHentaichanCcTypeKeys,
  },
};

export const createHentaichanCcParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  const directusGet = async <T>(path: string, params: Record<string, string>): Promise<T> => {
    const url = `${API_BASE}${path}?${new URLSearchParams(params).toString()}`;
    return ctx.http.getJson<T>(url);
  };

  const parseListItem = (item: MangaListItem): RawTitle => {
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
      releaseState: null,
      authors: [],
      description: item.description,
      chapters: null,
      source: SOURCE_ID,
      type: mangaTypeFor(item.type),
      year: new Date(item.date_created).getFullYear(),
      likes: item.likes,
      views: item.views,
      pages: item.pages,
      releaseFormats: [releaseFormatTitleFor(item.type)],
      addedAt: new Date(item.date_created).getTime(),
    };
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    const query: Record<string, string> = {
      limit: String(params.limit),
      offset: String(params.offset),
      sort: sortFor(params.order, params.direction),
      fields: LIST_FIELDS,
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

  /** Тайтлы по slug в порядке `slugs` — так блок сохраняет порядок сайта. */
  const fetchBySlugs = async (slugs: string[]): Promise<RawTitle[]> => {
    if (slugs.length === 0) return [];
    const res = await directusGet<DirectusListResponse<MangaListItem>>('/items/manga', {
      limit: String(slugs.length),
      fields: LIST_FIELDS,
      'filter[slug][_in]': slugs.join(','),
    });
    const bySlug = new Map(res.data.map((item) => [item.slug, parseListItem(item)]));
    return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
  };

  /** Порция «Новой манги» — страница каталога по дате добавления. */
  const fetchNewest = async (page: number): Promise<RawHomeSectionPage> => {
    const items = await getList({
      offset: (page - 1) * HOME_SECTION_SIZE,
      limit: HOME_SECTION_SIZE,
      order: SORT_ORDER.RELEASED,
    });
    return { items, hasNextPage: items.length === HOME_SECTION_SIZE };
  };

  /** «Популярная манга» за период; чужой период — за неделю. */
  const fetchPopular = async (variant: string | undefined): Promise<RawTitle[]> => {
    const period = POPULAR_PERIODS.find(({ id }) => id === variant)?.id ?? POPULAR_PERIOD.WEEK;
    const res = await ctx.http.get(`https://${domain}/`);
    return fetchBySlugs(parsePopularSlugs(res.text(), period));
  };

  const getHome = async () => {
    const [newest, popular] = await Promise.all([
      fetchNewest(1),
      fetchPopular(undefined).catch(() => []),
    ]);
    return toHomeSections(HENTAICHAN_CC_HOME_SECTIONS, {
      [HENTAICHAN_CC_HOME_SECTION.NEW]: newest.items,
      [HENTAICHAN_CC_HOME_SECTION.POPULAR]: popular,
    });
  };

  /** «Новая манга» листается порциями, «Популярная» — пять тайтлов за выбранный период. */
  const getHomeSection = async (
    id: string,
    { page, variant }: RawHomeSectionParams,
  ): Promise<RawHomeSectionPage | null> => {
    switch (id) {
      case HENTAICHAN_CC_HOME_SECTION.NEW:
        return fetchNewest(page);
      case HENTAICHAN_CC_HOME_SECTION.POPULAR:
        if (page > 1) return { items: [], hasNextPage: false };
        return { items: await fetchPopular(variant), hasNextPage: false };
      default:
        return null;
    }
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
   * even across a manga's own multiple rows) is the only reliable upload order. The `chapters`
   * collection itself carries no date field of its own (verified live) — every chapter of a
   * manga is stamped with that manga's own `date_created` instead, exact for the near-totality
   * of rows that only ever have the one chapter.
   */
  const fetchChapterIds = async (mangaId: string): Promise<number[]> => {
    const res = await directusGet<DirectusListResponse<ChapterListItem>>('/items/chapters', {
      'filter[manga][_eq]': mangaId,
      sort: 'id',
      fields: 'id',
    });
    return res.data.map((ch) => ch.id);
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const { mangaId, slug } = parseMangaUrl(mangaUrl);
    const [detailRes, chapterIds] = await Promise.all([
      directusGet<DirectusListResponse<MangaDetail>>('/items/manga', {
        'filter[id][_eq]': mangaId,
        limit: '1',
        fields:
          'id,name,slug,cover.filename_disk,description,russian_name,english_name,romaji_name,' +
          'type,likes,views,pages,date_created,' +
          'tags.tags_id.name,tags.tags_id.slug,authors.authors_id.name,' +
          'translators.translators_id.name,series.series_id.name',
      }),
      fetchChapterIds(mangaId),
    ]);
    const info = detailRes.data[0];
    if (!info) throw new ParseError(`Manga not found: ${mangaUrl}`, SOURCE_ID);

    const addedAt = new Date(info.date_created).getTime();
    const chapters: RawChapter[] = chapterIds.map((id, index) => ({
      id: generateUid(SOURCE_ID, id),
      title: null,
      number: index + 1,
      volume: null,
      url: String(id),
      scanlator: null,
      uploadDate: addedAt,
      branch: null,
      source: SOURCE_ID,
    }));

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
    const translators = [
      ...new Set(
        info.translators.map((t) => t.translators_id?.name).filter((n): n is string => !!n),
      ),
    ];

    // "Оригинальные работы" is the site's own series for works without a source franchise
    // (~3/4 of the catalog, verified live) — kept as-is, it's what the site itself shows there.
    const series = [
      ...new Set(info.series.map((s) => s.series_id?.name).filter((n): n is string => !!n)),
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
      releaseState: null,
      authors,
      series,
      translators,
      description: info.description,
      chapters,
      source: SOURCE_ID,
      type: mangaTypeFor(info.type),
      year: new Date(info.date_created).getFullYear(),
      likes: info.likes,
      views: info.views,
      pages: info.pages,
      releaseFormats: [releaseFormatTitleFor(info.type)],
      addedAt,
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
        settings: {
          range: { min: bounds.min.views, max: bounds.max.views },
          presets: VIEWS_PRESETS,
        },
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.LIKES,
        title: 'Лайки',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: bounds.min.likes, max: bounds.max.likes },
          presets: LIKES_PRESETS,
        },
      },
      {
        id: HENTAICHAN_CC_FILTER_GROUP.PAGES,
        title: 'Страницы',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: bounds.min.pages, max: bounds.max.pages },
          presets: PAGES_PRESETS,
        },
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
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.HENTAI,
      isBroken: false,
      isAdult: true,
      requiresVpn: true,
      sortOrders: [
        SORT_ORDER.RELEASED,
        SORT_ORDER.UPDATED,
        SORT_ORDER.POPULARITY,
        SORT_ORDER.RATING,
        SORT_ORDER.PAGES,
      ],
      supportsDirection: true,
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: true,
      isSearchWithFiltersSupported: true,
      homeSections: HENTAICHAN_CC_HOME_SECTIONS,
    },
    getList,
    getBookmarks: () => fetchHentaichanCcBookmarks(ctx),
    getDetails,
    getPages,
    getFilters,
    getHome,
    getHomeSection,
    resolveSearchFilters: (criteria) => buildSearchFilters(criteria, SEARCH_FILTER_SPEC),
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

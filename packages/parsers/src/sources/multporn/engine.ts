import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type {
  RawChapter,
  RawFilterGroup,
  RawFilterOption,
  RawManga,
  RawPage,
  RawTag,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { FILTER_GROUP } from '../../core/filters/group';
import { catalogEntryFor } from '../catalog';
import type { MultpornConfig } from './config';

const BROWSE_PAGE_SIZE = 15;
/** Page size of every taxonomy-route listing (`/category_hentai/*`, `/characters_hentai/*`,
 *  comics' `/category/*`, `/characters/*`) — verified live across several terms, always 10
 *  regardless of the term. */
const TAXONOMY_PAGE_SIZE = 10;

/** `tag`/`character`/`series` each replace `/new` as the listing route, and `language` only
 *  exists as a field on `/new`'s own exposed form — verified live that none of the four combine
 *  with each other (a taxonomy-route page's exposed form has no `language` field at all). */
const ROUTE_EXCLUSIVE_GROUP = 'route';

export const MULTPORN_FILTER_GROUP = {
  TAG: FILTER_GROUP.TAG,
  CHARACTER: FILTER_GROUP.CHARACTER,
  SERIES: FILTER_GROUP.SERIES,
  LANGUAGE: FILTER_GROUP.LANGUAGE,
} as const;

/** `/new`'s exposed Views form's `language` field — verified live against multporn_hentai
 *  (`/new?type=3`): `All` (no restriction) plus exactly these five. */
const LANGUAGE_OPTIONS: RawFilterOption[] = [
  { key: '1', title: 'English', count: null },
  { key: '2', title: 'German', count: null },
  { key: '3', title: 'Russian', count: null },
  { key: '4', title: 'Chinese', count: null },
  { key: '5', title: 'Spanish', count: null },
];
/** `/search`'s native Views page size — verified against several live queries, always 20 rows
 *  regardless of how many of them end up matching this source's `pathPrefix`. */
const SEARCH_RAW_PAGE_SIZE = 20;

const IMG_SRC_RE = /<img[^>]*\ssrc="([^"]+)"/g;
/** Listing rows carry `<h5><span>Date: </span><span>23/04/2024 - 14:47</span></h5>` — the only
 *  `<h5>` in a row with no `views-field-*` class, verified live across both content types. */
const LISTING_DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;

/**
 * Drupal image styles serve a downsized derivative at `.../styles/<name>/public/<path>?itok=...`;
 * stripping that prefix (and the token) resolves to the original upload — verified live: the
 * `juicebox_medium` thumbnail and the equivalent original both 200, original ~5x the bytes.
 */
const originalFileUrl = (styledUrl: string): string => {
  return styledUrl.replace(/\/styles\/[^/]+\/public\//, '/').split('?')[0]!;
};

const parseCategoryLinks = (
  $links: Cheerio<AnyNode>,
  $: CheerioAPI,
  sourceId: string,
): RawTag[] => {
  const seen = new Set<string>();
  const tags: RawTag[] = [];
  $links.toArray().forEach((el) => {
    const $a = $(el);
    const title = textOrNull($a);
    if (!title) return;
    const href = attrOrNull($a, 'href') ?? '';
    const key = href.split('/').filter(Boolean).pop() ?? title;
    if (seen.has(key)) return;
    seen.add(key);
    tags.push({ title, key, source: sourceId });
  });
  return tags;
};

/**
 * The Drupal fivestar widget renders `<span class="average-rating">Average: <span>4.6</span>
 * </span>` on a 0..5 star scale, same markup on listing rows and the detail page — verified live
 * for both `multporn`/`multporn_hentai`. Every other parser normalizes its native rating scale
 * down to 0..1 (see e.g. senkuro's `score / 10`), so a 0..5 average divides by 5 here instead.
 */
const parseAverageRating = ($scope: Cheerio<AnyNode>): number => {
  const text = textOrNull($scope.find('.average-rating').first());
  const match = text?.match(/[\d.]+/);
  if (!match) return RATING_UNKNOWN;
  const average = Number.parseFloat(match[0]);
  return Number.isFinite(average) && average > 0 ? average / 5 : RATING_UNKNOWN;
};

const parseListingYear = ($row: Cheerio<AnyNode>): number | null => {
  const text = textOrNull($row.find('h5:not([class])').first());
  const match = text?.match(LISTING_DATE_RE);
  return match ? Number.parseInt(match[3]!, 10) : null;
};

/**
 * The gallery's real markup lives inside `<noscript>` ("for non-javascript devices" — the JS
 * juicebox widget it's a fallback for is never executed here anyway). htmlparser2 keeps a
 * `<noscript>`'s contents as a raw text blob rather than parsing it into queryable child
 * elements, so `<img>` `src`s have to be pulled out of that string with a regex instead of a
 * normal cheerio selector.
 */
const extractGalleryImageSrcs = ($root: Cheerio<AnyNode>): string[] => {
  const noscriptHtml =
    $root.find('.field-name-field-com-pages .juicebox-container noscript').first().html() ?? '';
  const srcs: string[] = [];
  let match: RegExpExecArray | null;
  IMG_SRC_RE.lastIndex = 0;
  while ((match = IMG_SRC_RE.exec(noscriptHtml))) {
    srcs.push(match[1]!);
  }
  return srcs;
};

/**
 * `/new`'s exposed Views sort form only accepts `created`/`changed` — verified live that
 * `title`/`totalcount`/`value` (the extra fields `resolveTaxonomySortBy` maps VIEWS/RATING to
 * below) all silently render an EMPTY page here instead of erroring or falling back. Since this
 * route runs whenever no tag/character is selected, VIEWS/RATING fall back to `changed` (this
 * route's own default) rather than reaching it — `sort_order` (ASC/DESC) applies to either.
 */
const resolveSortBy = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.ADDED:
      return 'created';
    case SORT_ORDER.UPDATED:
    case SORT_ORDER.VIEWS:
    case SORT_ORDER.RATING:
    default:
      return 'changed';
  }
};

const resolveSortOrder = (direction: string | undefined): string =>
  direction === SORT_DIRECTION.ASC ? 'ASC' : 'DESC';

/**
 * Taxonomy-route views (`/category_hentai/*`, `/characters_hentai/*`, `/category/*`,
 * `/characters/*`, `/comics/*`, `/manga/*`) accept `sort_by=title|created|totalcount|value` —
 * verified live across all four taxonomies on both content types, but only `created` respects
 * `sort_order`; `totalcount` (views), `value` (rating) and `title` (alphabetical) each render one
 * fixed order regardless of ASC/DESC. `title` genuinely sorts alphabetically (verified across
 * pages — e.g. `/category_hentai/ahegao`'s page 0 ends mid-A, page 7 continues into the B's) —
 * it's just byte-identical to omitting `sort_by` entirely, since that's this view's own baked-in
 * default order. `sort_by=changed` (what `resolveSortBy` maps SortOrder.UPDATED to for `/new`)
 * silently renders an EMPTY page on this route, so UPDATED falls back to `created` — the closest
 * of the working fields.
 */
/** What TAG/CHARACTER/SERIES FilterGroups declare via FilterGroup.sortOrders — UPDATED is left
 *  out since it folds into ADDED's `created` here anyway (see resolveTaxonomySortBy). */
const TAXONOMY_SORT_ORDERS = [
  SORT_ORDER.ADDED,
  SORT_ORDER.VIEWS,
  SORT_ORDER.RATING,
  SORT_ORDER.ALPHABETICAL,
];

const resolveTaxonomySortBy = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.VIEWS:
      return 'totalcount';
    case SORT_ORDER.RATING:
      return 'value';
    case SORT_ORDER.ALPHABETICAL:
      return 'title';
    case SORT_ORDER.ADDED:
    case SORT_ORDER.UPDATED:
    default:
      return 'created';
  }
};

const findSingleSelection = (
  filters: FilterSelection[] | undefined,
  groupId: string,
): string | null => {
  const found = filters?.find(
    (f): f is Extract<FilterSelection, { key: string }> => 'key' in f && f.groupId === groupId,
  );
  return found?.key ?? null;
};

/** Shared by every taxonomy full-listing page (`/manga_tags`, `/characters_hentai`) — each term's
 *  `<a>` links to its own browse route (`pathPrefix`); the key is the slug after that prefix. */
const parseFilterOptionLinks = (
  $links: Cheerio<AnyNode>,
  $: CheerioAPI,
  pathPrefix: string,
): RawFilterOption[] => {
  const seen = new Set<string>();
  const options: RawFilterOption[] = [];
  $links.toArray().forEach((el) => {
    const $a = $(el);
    const title = textOrNull($a);
    const href = attrOrNull($a, 'href');
    if (!title || !href || !href.startsWith(pathPrefix)) return;
    const key = href.slice(pathPrefix.length).split('?')[0];
    if (!key || seen.has(key)) return;
    seen.add(key);
    options.push({ key, title, count: null });
  });
  return options;
};

export const createMultpornParser = (cfg: MultpornConfig, ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  /** Shared row shape between `/new` (single content type per request) and `/search` (mixed
   *  types in one feed) — `pathPrefix` is what lets a single parser pick its own rows out of
   *  the latter. */
  const parseRow = ($row: Cheerio<AnyNode>, $: CheerioAPI, baseUrl: string): RawManga | null => {
    const $a = $row.find('.views-field-title a').first();
    if ($a.length === 0) return null;
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw || !hrefRaw.startsWith(cfg.pathPrefix)) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const title = textOrNull($a) ?? '';

    const $img = $row.find('img[src]').first();
    const coverUrl = attrOrNull($img, 'src') ? absUrl($img, 'src', baseUrl) : null;

    return {
      id: generateUid(cfg.id, relUrl),
      title,
      altTitles: [],
      url: relUrl,
      publicUrl,
      rating: parseAverageRating($row),
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      tags: parseCategoryLinks($row.find(cfg.listTagSelector), $, cfg.id),
      releaseState: null,
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: cfg.id,
      year: parseListingYear($row),
    };
  };

  const buildBrowseUrl = (
    page: number,
    order: string | undefined,
    direction: string | undefined,
    language: string | null,
  ): string => {
    const url = new URL('/new', `https://${domain}/`);
    url.searchParams.set('type', cfg.typeParam);
    url.searchParams.set('language', language ?? 'All');
    url.searchParams.set('field_user_discription_value', 'All');
    url.searchParams.set('sort_by', resolveSortBy(order));
    url.searchParams.set('sort_order', resolveSortOrder(direction));
    url.searchParams.set('page', String(page));
    return url.toString();
  };

  const fetchBrowsePage = async (
    page: number,
    order: string | undefined,
    direction: string | undefined,
    language: string | null,
  ): Promise<RawManga[]> => {
    const doc = await ctx.http.getHtml(buildBrowseUrl(page, order, direction, language));
    return doc
      .$('.view-content .masonry-item')
      .toArray()
      .map((el) => parseRow(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  /**
   * A selected tag/character replaces `/new` with that term's own browse route
   * (`<pathPrefix><key>`) — same page size (10) and row markup (`views-field-*` divs) as `/new`,
   * just laid out as `<table class="views-view-grid"><td>` cells instead of masonry `<div>`s, so
   * `parseRow` is reused unchanged. Page 0 has no `page` param; page N>0 uses this view's own
   * two-pager syntax (`page=0,<n>` — position 0 is an unrelated teaser block above the grid,
   * verified live to always stay 0 while position 1 advances the grid itself).
   */
  const fetchTaxonomyPage = async (
    pathPrefix: string,
    key: string,
    page: number,
    order: string | undefined,
    direction: string | undefined,
  ): Promise<RawManga[]> => {
    const url = new URL(`${pathPrefix}${key}`, `https://${domain}/`);
    if (page > 0) url.searchParams.set('page', `0,${page}`);
    url.searchParams.set('sort_by', resolveTaxonomySortBy(order));
    url.searchParams.set('sort_order', resolveSortOrder(direction));
    const doc = await ctx.http.getHtml(url.toString());
    return doc
      .$('.view-content td')
      .toArray()
      .map((el) => parseRow(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  /**
   * `/search` has no content-type filter of its own — one query mixes all ~12 node types
   * (comics, hentai manga, pictures, video, games, ...) into a single 20-row native page.
   * Reusing `fetchPaged`'s "short page = end" heuristic against the post-filter count would
   * stop after page 1 any time most of a page's rows belong to some other type, so this walks
   * raw pages instead and only stops when a raw page itself comes back short.
   */
  const fetchSearchList = async (params: ListParams): Promise<RawManga[]> => {
    const acc: RawManga[] = [];
    let rawPage = 0;
    for (;;) {
      const url = new URL('/search', `https://${domain}/`);
      url.searchParams.set('search_api_views_fulltext', params.query ?? '');
      url.searchParams.set('page', String(rawPage));
      const doc = await ctx.http.getHtml(url.toString());
      const rows = doc.$('.view-content .masonry-item').toArray();
      rows
        .map((el) => parseRow(doc.$(el), doc.$, doc.baseUrl))
        .filter((m): m is RawManga => m !== null)
        .forEach((m) => acc.push(m));
      rawPage += 1;
      if (acc.length >= params.offset + params.limit || rows.length < SEARCH_RAW_PAGE_SIZE) break;
    }
    return acc.slice(params.offset, params.offset + params.limit);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    if (params.query) return fetchSearchList(params);

    if (cfg.filters) {
      const tagKey = findSingleSelection(params.filters, MULTPORN_FILTER_GROUP.TAG);
      if (tagKey !== null) {
        return fetchPaged(params, { size: TAXONOMY_PAGE_SIZE, firstPage: 0 }, (page) =>
          fetchTaxonomyPage(
            cfg.filters!.tagPathPrefix,
            tagKey,
            page,
            params.order,
            params.direction,
          ),
        );
      }
      const characterKey = findSingleSelection(params.filters, MULTPORN_FILTER_GROUP.CHARACTER);
      if (characterKey !== null) {
        return fetchPaged(params, { size: TAXONOMY_PAGE_SIZE, firstPage: 0 }, (page) =>
          fetchTaxonomyPage(
            cfg.filters!.characterPathPrefix,
            characterKey,
            page,
            params.order,
            params.direction,
          ),
        );
      }
      const seriesKey = findSingleSelection(params.filters, MULTPORN_FILTER_GROUP.SERIES);
      if (seriesKey !== null) {
        return fetchPaged(params, { size: TAXONOMY_PAGE_SIZE, firstPage: 0 }, (page) =>
          fetchTaxonomyPage(
            cfg.filters!.seriesPathPrefix,
            seriesKey,
            page,
            params.order,
            params.direction,
          ),
        );
      }
    }

    const languageKey = findSingleSelection(params.filters, MULTPORN_FILTER_GROUP.LANGUAGE);
    return fetchPaged(params, { size: BROWSE_PAGE_SIZE, firstPage: 0 }, (page) =>
      fetchBrowsePage(page, params.order, params.direction, languageKey),
    );
  };

  /**
   * All full-listing pages (`/manga_tags`, `/characters_hentai`, `/manga`, ...) share this shape:
   * page 0's markup plus a plain `?page=N` pager, term `<a>`s prefixed by the term's own browse
   * route.
   * Page 0 is fetched first to read `li.pager-last a`'s own `page=` value (absent entirely means
   * page 0 is the only/last page) so the remaining pages can be fetched in parallel instead of
   * walking them one at a time.
   */
  const fetchTaxonomyOptions = async (
    basePath: string,
    pathPrefix: string,
  ): Promise<RawFilterOption[]> => {
    const separator = basePath.includes('?') ? '&' : '?';
    const pageUrl = (page: number) =>
      `https://${domain}${basePath}${page > 0 ? `${separator}page=${page}` : ''}`;

    const firstDoc = await ctx.http.getHtml(pageUrl(0));
    const collect = (doc: typeof firstDoc) =>
      parseFilterOptionLinks(doc.$(`a[href^="${pathPrefix}"]`), doc.$, pathPrefix);

    const lastPageHref = attrOrNull(firstDoc.$('li.pager-last a').first(), 'href');
    const lastPage = lastPageHref
      ? Number.parseInt(new URL(lastPageHref, firstDoc.baseUrl).searchParams.get('page') ?? '0', 10)
      : 0;

    const restPages =
      lastPage > 0
        ? await Promise.all(
            Array.from({ length: lastPage }, (_, i) => i + 1).map(async (page) => {
              const doc = await ctx.http.getHtml(pageUrl(page));
              return collect(doc);
            }),
          )
        : [];

    const seen = new Set<string>();
    return [collect(firstDoc), ...restPages].flat().filter((option) => {
      if (seen.has(option.key)) return false;
      seen.add(option.key);
      return true;
    });
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    if (!cfg.filters) return [];
    const [tagOptions, characterOptions, seriesOptions] = await Promise.all([
      fetchTaxonomyOptions(cfg.filters.tagListPath, cfg.filters.tagPathPrefix),
      fetchTaxonomyOptions(cfg.filters.characterListPath, cfg.filters.characterPathPrefix),
      fetchTaxonomyOptions(cfg.filters.seriesListPath, cfg.filters.seriesPathPrefix),
    ]);

    const groups: RawFilterGroup[] = [];
    if (tagOptions.length > 0) {
      groups.push({
        id: MULTPORN_FILTER_GROUP.TAG,
        title: 'Tags',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: tagOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: TAXONOMY_SORT_ORDERS,
        supportsDirection: false,
      });
    }
    if (characterOptions.length > 0) {
      groups.push({
        id: MULTPORN_FILTER_GROUP.CHARACTER,
        title: 'Character',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: characterOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: TAXONOMY_SORT_ORDERS,
        supportsDirection: false,
      });
    }
    if (seriesOptions.length > 0) {
      groups.push({
        id: MULTPORN_FILTER_GROUP.SERIES,
        title: 'Series',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: seriesOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: TAXONOMY_SORT_ORDERS,
        supportsDirection: false,
      });
    }
    groups.push({
      id: MULTPORN_FILTER_GROUP.LANGUAGE,
      title: 'Language',
      type: FILTER_TYPE.RADIO,
      options: LANGUAGE_OPTIONS,
      exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
    });
    return groups;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const $ = doc.$;
    const root = $('article.node').first();
    if (root.length === 0) throw new ParseError('Cannot find article.node', cfg.id);

    const title = textOrNull($('h1.title').first()) ?? mangaUrl;
    const author = nullIfEmpty(textOrNull(root.find(cfg.authorSelector).first()));
    const tags = parseCategoryLinks(root.find(cfg.detailTagSelector), $, cfg.id);

    // og:image/og:description come from Drupal's site-wide metatag module — a reliably present,
    // pre-sized (1500x1500) cover and a real blurb, unlike the reading gallery which has neither.
    const $ogImage = $('meta[property="og:image"]').first();
    const coverUrl = attrOrNull($ogImage, 'content')
      ? toAbsoluteUrl(attrOrNull($ogImage, 'content')!, domain)
      : null;
    const description = nullIfEmpty(
      attrOrNull($('meta[property="og:description"]').first(), 'content'),
    );

    // Same document getPages would otherwise re-fetch for this manga's one chapter (its url is
    // the manga url itself) — counting the gallery here saves that round trip.
    const galleryUrls = new Set(
      extractGalleryImageSrcs(root).map((src) => originalFileUrl(toAbsoluteUrl(src, domain))),
    );

    const chapter: RawChapter = {
      id: generateUid(cfg.id, mangaUrl),
      url: mangaUrl,
      title,
      number: 0,
      volume: 0,
      scanlator: null,
      // Not exposed anywhere on the details page itself (only on `/new` listing rows, which
      // getDetails never sees) — 0 is the documented "unknown" sentinel, not a parsing gap.
      uploadDate: 0,
      branch: null,
      source: cfg.id,
    };

    return {
      id: generateUid(cfg.id, mangaUrl),
      title,
      altTitles: [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: parseAverageRating(root),
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      largeCoverUrl: coverUrl,
      tags,
      releaseState: null,
      authors: author ? [author] : [],
      description,
      chapters: [chapter],
      source: cfg.id,
      pages: galleryUrls.size > 0 ? galleryUrls.size : null,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const absoluteUrl = toAbsoluteUrl(chapterUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const seen = new Set<string>();
    const pages: RawPage[] = [];
    for (const src of extractGalleryImageSrcs(doc.$('article.node').first())) {
      const abs = toAbsoluteUrl(src, domain);
      const url = originalFileUrl(abs);
      if (seen.has(url)) continue;
      seen.add(url);
      pages.push({ id: generateUid(cfg.id, url), url, preview: null, source: cfg.id });
    }
    if (pages.length === 0) throw new ParseError('No pages found', cfg.id);
    return pages;
  };

  return {
    id: cfg.id,
    info: {
      id: cfg.id,
      title: catalogEntryFor(cfg.id).title,
      domain,
      locale: SOURCE_LOCALE.EN,
      contentType: catalogEntryFor(cfg.id).contentType,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      requiresVpn: catalogEntryFor(cfg.id).requiresVpn,
      // VIEWS/RATING/ALPHABETICAL only do anything once a tag/character/series is selected
      // (resolveSortBy falls back to `changed` for them on plain `/new` browsing, same as
      // UPDATED) — the TAG/CHARACTER/SERIES FilterGroups below narrow this down to their own
      // working set via FilterGroup.sortOrders.
      sortOrders: [SORT_ORDER.UPDATED, SORT_ORDER.ADDED],
      // Only `created` (SortOrder.ADDED) respects ASC/DESC on either route — `changed` (UPDATED,
      // `/new` only) always sorts DESC, and `totalcount`/`value`/`title` (VIEWS/RATING/
      // ALPHABETICAL, taxonomy routes only) each render one fixed order regardless of direction,
      // verified live. The TAG/CHARACTER/SERIES FilterGroups set their own
      // supportsDirection: false to hide the toggle rather than exposing it for a lone ADDED case.
      supportsDirection: true,
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: cfg.filters !== undefined,
    },
    getList,
    getDetails,
    getPages,
    ...(cfg.filters ? { getFilters } : {}),
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

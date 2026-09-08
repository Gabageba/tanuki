import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawFilterGroup, RawFilterOption, RawManga, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { parseGroupleDate } from '../../core/text/dates';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { FILTER_GROUP } from '../../core/filters/group';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.SEXKOMIX2;
/**
 * /home renders 24 `li.comix` slots per page, one of them always an ad placeholder (no `<a>`)
 * that parseMangaTile filters out — verified live across several pages, including far past the
 * real end of the catalog (the site never shrinks or 404s there, it just keeps re-serving its
 * last real page, so a short page reliably means "end of catalog" and never a false negative).
 * 23, not 24, is what fetchListPage actually returns per page, and fetchPaged's "short page =
 * end" check needs that real count or every page falsely looks like the last one.
 */
const HOME_PAGE_SIZE = 23;
/**
 * /search, /categories, /tag_page, /translator and /studios all share a narrower catalog
 * template than /home — verified live (multiple queries, category/tag/translator/studio keys,
 * and pages far past each one's real end): 20 `li.comix` slots per page, again one always an ad
 * placeholder, so 19 real items per page. /search was previously assumed to share HOME_PAGE_SIZE
 * with /home, which is wrong and silently truncated search results after their first ~19 real
 * hits (fetchPaged's short-page check tripped on a 19-item page it expected to be 23-item-full).
 */
const FILTERED_PAGE_SIZE = 19;

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.POPULARITY:
      return 'prosmotr';
    case SORT_ORDER.RATING:
      return 'like';
    default:
      return 'date';
  }
};

export const SEXKOMIX2_FILTER_GROUP = {
  CATEGORY: FILTER_GROUP.CATEGORY,
  TAG: FILTER_GROUP.TAG,
  TRANSLATOR: FILTER_GROUP.TRANSLATOR,
  /** "Студии" — same concept getDetails already reads off `Студия:` into RawManga.authors. */
  AUTHOR: FILTER_GROUP.AUTHOR,
} as const;

/**
 * Categories, tags, translators and studios are four separate top-level browse routes on this
 * site (`/categories/`, `/tag_page/`, `/translator/`, `/studios/`) — verified live that none of
 * them combine into a single listing (e.g. joining two tag keys the way NudeMoon's `/tags/`
 * does just 400s here; a translator selection has no way to also carry a category). Tagging
 * every one of their RawFilterGroups with the same exclusiveGroup lets the UI enforce "pick one
 * axis" instead of silently dropping whichever this parser doesn't route to.
 */
const ROUTE_EXCLUSIVE_GROUP = 'route';

type FilterRoute = {
  groupId: string;
  path: string;
  paramName: string;
  /** `/translator/` and `/studios/` are the two routes whose own sidebar links never carry
   *  `lang=ru` — verified live each works exactly the same without it, so this just mirrors the
   *  site's own hrefs instead of guessing. */
  hasLang: boolean;
};

/**
 * `sexkomix2.com` (the source's other listed domain, not the one this parser actually runs
 * against — see SOURCE_CATALOG) names this route `tag_pagex`; the live `ctx.domain` mirror uses
 * `tag_page` (no `x`) instead — verified directly against both. Every other path/param here was
 * cross-checked against the live mirror too rather than assumed from that other domain.
 */
const FILTER_ROUTES: readonly FilterRoute[] = [
  { groupId: SEXKOMIX2_FILTER_GROUP.CATEGORY, path: 'categories', paramName: 'cat', hasLang: true },
  { groupId: SEXKOMIX2_FILTER_GROUP.TAG, path: 'tag_page', paramName: 't', hasLang: true },
  {
    groupId: SEXKOMIX2_FILTER_GROUP.TRANSLATOR,
    path: 'translator',
    paramName: 'cat',
    hasLang: false,
  },
  {
    groupId: SEXKOMIX2_FILTER_GROUP.AUTHOR,
    path: 'studios',
    paramName: 'cat',
    hasLang: false,
  },
];

const findSingleSelection = (
  filters: FilterSelection[] | undefined,
  groupId: string,
): string | null => {
  const found = filters?.find(
    (f): f is Extract<FilterSelection, { key: string }> => 'key' in f && f.groupId === groupId,
  );
  return found?.key ?? null;
};

/** Dedupes by the tag's own `tag_page` slug — the same tag can appear on multiple `<a>`s. */
const parseTagLinks = ($links: Cheerio<AnyNode>, $: CheerioAPI): RawTag[] => {
  const seen = new Set<string>();
  const tags: RawTag[] = [];
  $links.toArray().forEach((el) => {
    const $a = $(el);
    const title = textOrNull($a);
    if (!title) return;
    const href = attrOrNull($a, 'href') ?? '';
    const key = new URL(href, 'https://x/').searchParams.get('t') ?? title;
    if (seen.has(key)) return;
    seen.add(key);
    tags.push({ title, key, source: SOURCE_ID });
  });
  return tags;
};

/**
 * The page markup has *three* `<ul id="comix_directory">` (duplicate, non-unique ids): a VIP
 * promo carousel, the real paginated catalog, and a "more comics" widget nested inside
 * `#more_comics_directory`. Only the middle one tracks `sort=`/`page=` — the other two are
 * fixed extras that would corrupt both item counts and pagination if scraped. It's first on
 * /search (no promo carousel there) and second on /home, but always the last one not nested
 * in `#more_comics_directory`.
 */
const findCatalogList = ($: CheerioAPI): Cheerio<AnyNode> => {
  return $('ul#comix_directory')
    .filter((_, el) => $(el).parents('#more_comics_directory').length === 0)
    .last();
};

export const createSexKomix2Parser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  const parseMangaTile = (
    $item: Cheerio<AnyNode>,
    $: CheerioAPI,
    baseUrl: string,
  ): RawManga | null => {
    const $a = $item.find('a').first();
    if ($a.length === 0) return null;
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const title =
      textOrNull($item.find('.comix_title').first())?.replace('Порно комикс ', '') ?? '';
    const $img = $item.find('img.comix_img').first();
    const coverUrl = attrOrNull($img, 'data-src') ? absUrl($img, 'data-src', baseUrl) : null;

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: [],
      url: relUrl,
      publicUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      tags: parseTagLinks($item.find('ul.tags_ul a'), $),
      releaseState: null,
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const fetchListPage = async (path: string): Promise<RawManga[]> => {
    const doc = await ctx.http.getHtml(toAbsoluteUrl(path, domain));
    return findCatalogList(doc.$)
      .find('li.comix')
      .toArray()
      .map((el) => parseMangaTile(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  /** One of the four FILTER_ROUTES if a selection picked one, else /search, else plain /home. */
  const resolveListRoute = (
    order: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): { pageSize: number; pathForPage: (page: number) => string } => {
    const sort = getSortKey(order);
    for (const route of FILTER_ROUTES) {
      const key = findSingleSelection(filters, route.groupId);
      if (key === null) continue;
      const lang = route.hasLang ? 'lang=ru&' : '';
      const value = encodeURIComponent(key);
      return {
        pageSize: FILTERED_PAGE_SIZE,
        pathForPage: (page) =>
          `/${route.path}/?${lang}${route.paramName}=${value}&sort=${sort}&page=${page}`,
      };
    }
    if (query) {
      const q = encodeURIComponent(query);
      return {
        pageSize: FILTERED_PAGE_SIZE,
        pathForPage: (page) => `/search/?lang=ru&q=${q}&sort=${sort}&page=${page}`,
      };
    }
    return {
      pageSize: HOME_PAGE_SIZE,
      pathForPage: (page) => `/home/?lang=ru&only=&sort=${sort}&page=${page}`,
    };
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    const route = resolveListRoute(params.order, params.query, params.filters);
    return fetchPaged(params, { size: route.pageSize, firstPage: 1 }, (page) =>
      fetchListPage(route.pathForPage(page)),
    );
  };

  /** "Студия:" / "Переводчик:" are two `.studio_translator_box` blocks; value is the sibling link's text. */
  const findStudioTranslatorValue = ($: CheerioAPI, label: string): string | null => {
    const $label = $('.studio_translator')
      .toArray()
      .map((el) => $(el))
      .find((el) => (textOrNull(el) ?? '').includes(label));
    if (!$label) return null;
    return nullIfEmpty(textOrNull($label.siblings('.link_button').find('a').first()));
  };

  const findDescriptionHtml = ($: CheerioAPI): string | null => {
    const $box = $('#comix_description .info_box')
      .toArray()
      .map((el) => $(el))
      .find((el) => (textOrNull(el) ?? '').startsWith('Описание'));
    return $box ? $box.find('p').first().html() : null;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);

    const title = textOrNull(doc.$('#comix_description h1').first()) ?? mangaUrl;
    const $cover = doc.$('#comix_cover_img').first();
    const largeCoverUrl = attrOrNull($cover, 'data-src')
      ? absUrl($cover, 'data-src', doc.baseUrl)
      : null;
    const author = findStudioTranslatorValue(doc.$, 'Студия');
    const scanlator = findStudioTranslatorValue(doc.$, 'Переводчик');
    const uploadDate = parseGroupleDate(
      textOrNull(doc.$('li[title="Дата публикации комикса"] .cifra-info-set').first()),
    );
    // Was `tag_pagex` (with an `x`) — that's the other domain listed for this source in
    // SOURCE_CATALOG, not the one `ctx.domain` actually points at, whose own route is
    // `tag_page` (no `x`); the mismatched substring silently matched nothing here, so every
    // manga's tags on getDetails came back empty. See FILTER_ROUTES' comment on the same split.
    const tags = parseTagLinks(doc.$('#comix_description a[href*="tag_page"]'), doc.$);

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title,
      altTitles: [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: null,
      largeCoverUrl,
      tags,
      releaseState: null,
      authors: author ? [author] : [],
      description: findDescriptionHtml(doc.$),
      chapters: [
        {
          id: generateUid(SOURCE_ID, mangaUrl),
          url: mangaUrl,
          title,
          number: 0,
          volume: 0,
          scanlator,
          uploadDate,
          branch: null,
          source: SOURCE_ID,
        },
      ],
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const absoluteUrl = toAbsoluteUrl(chapterUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const seen = new Set<string>();
    const pages: RawPage[] = [];
    doc.$('#comix_pages_ul img[data-src]').each((_, el) => {
      const raw = attrOrNull(doc.$(el), 'data-src');
      if (!raw) return;
      const url = toAbsoluteUrl(raw, domain);
      if (seen.has(url)) return;
      seen.add(url);
      pages.push({ id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID });
    });
    if (pages.length === 0) throw new ParseError('No pages found', SOURCE_ID);
    return pages;
  };

  /** Reads an option's key straight off its own link's `href` query param — same approach as
   *  parseTagLinks above, just generalized to whichever param a given route keys its filter on
   *  (`cat` for categories/translator/studios, `t` for tags). */
  const parseQueryParamOptions = (
    $links: Cheerio<AnyNode>,
    $: CheerioAPI,
    paramName: string,
  ): RawFilterOption[] => {
    const seen = new Set<string>();
    const options: RawFilterOption[] = [];
    $links.toArray().forEach((el) => {
      const $a = $(el);
      const title = textOrNull($a);
      if (!title) return;
      const href = attrOrNull($a, 'href') ?? '';
      const key = new URL(href, 'https://x/').searchParams.get(paramName);
      if (!key || seen.has(key)) return;
      seen.add(key);
      options.push({ key, title, count: null });
    });
    return options;
  };

  /** The sidebar's "Категории" block is a fixed ~35-entry list rendered on every page — unlike
   *  tags/translators/studios, it needs no separate full-listing page of its own. */
  const findSidebarLinks = ($: CheerioAPI, label: string): Cheerio<AnyNode> => {
    const $box = $('ul.sorting_box')
      .toArray()
      .map((el) => $(el))
      .find((el) => (textOrNull(el.find('li.sorting_name').first()) ?? '').includes(label));
    return $box ? $box.find('li.sorting_item a') : $();
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const [homeDoc, tagsDoc, translatorDoc, studiosDoc] = await Promise.all([
      ctx.http.getHtml(`https://${domain}/home/?lang=ru`),
      ctx.http.getHtml(`https://${domain}/tags/?lang=ru`),
      ctx.http.getHtml(`https://${domain}/all_translator/`),
      ctx.http.getHtml(`https://${domain}/all_studios/`),
    ]);

    const categoryOptions = parseQueryParamOptions(
      findSidebarLinks(homeDoc.$, 'Категории'),
      homeDoc.$,
      'cat',
    );
    const tagOptions = parseQueryParamOptions(tagsDoc.$('.tags_box a'), tagsDoc.$, 't');
    const translatorOptions = parseQueryParamOptions(
      translatorDoc.$('.tags_box a'),
      translatorDoc.$,
      'cat',
    );
    const studioOptions = parseQueryParamOptions(studiosDoc.$('.tags_box a'), studiosDoc.$, 'cat');

    const groups: RawFilterGroup[] = [];
    if (categoryOptions.length > 0) {
      groups.push({
        id: SEXKOMIX2_FILTER_GROUP.CATEGORY,
        title: 'Категории',
        type: FILTER_TYPE.RADIO,
        options: categoryOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
      });
    }
    if (tagOptions.length > 0) {
      groups.push({
        id: SEXKOMIX2_FILTER_GROUP.TAG,
        title: 'Теги',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: tagOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
      });
    }
    if (translatorOptions.length > 0) {
      groups.push({
        id: SEXKOMIX2_FILTER_GROUP.TRANSLATOR,
        title: 'Переводчики',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: translatorOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
      });
    }
    if (studioOptions.length > 0) {
      groups.push({
        id: SEXKOMIX2_FILTER_GROUP.AUTHOR,
        title: 'Студии',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: studioOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
      });
    }
    return groups;
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'SexKomix2',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.COMICS,
      isBroken: false,
      isAdult: true,
      requiresVpn: false,
      sortOrders: [SORT_ORDER.POPULARITY, SORT_ORDER.RATING, SORT_ORDER.RELEASED],
      supportsDirection: false,
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

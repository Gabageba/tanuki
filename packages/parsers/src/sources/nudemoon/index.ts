import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { CookieJar } from 'tough-cookie';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_TYPE,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import type {
  RawFilterGroup,
  RawFilterOption,
  RawTitle,
  RawTitleType,
  RawPage,
  RawTag,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { toTitleCase, nullIfEmpty } from '../../core/text/strings';
import { ParseError, SourceAuthRequiredError } from '../../errors';
import { FILTER_GROUP } from '../../core/filters/group';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.NUDEMOON;
/** The site's own `all_manga` pager advances `rowstart` by 30 raw rows per page. */
const ROWSTART_STEP = 30;

export const NUDEMOON_FILTER_GROUP = {
  TAG: FILTER_GROUP.TAG,
  SERIES: FILTER_GROUP.SERIES,
  AUTHOR: FILTER_GROUP.AUTHOR,
  GROUP: FILTER_GROUP.GROUP,
  TRANSLATOR: FILTER_GROUP.TRANSLATOR,
} as const;

/**
 * `/tags/`, `/mangaka/`, `/seria/`, `/group/` and `/perevod/` are five separate top-level routes
 * on this DLE fork — verified live that an entity route never combines with another (joining two
 * `/mangaka/<slug1>_<slug2>_` slugs the way `/tags/` joins tag keys returns an empty listing).
 * Tagging every one of their RawFilterGroups with the same exclusiveGroup lets the UI enforce
 * "pick one axis" instead of silently dropping whichever the parser doesn't route to.
 */
const ROUTE_EXCLUSIVE_GROUP = 'route';

/** `/mangaka/`, `/seria/`, `/group/` and `/perevod/` drop PAGES from the default sortOrders below
 *  (see getEntitySortKey) — the site has no per-title page count column on those listings for it
 *  to sort by. */
const ENTITY_ROUTE_SORT_ORDERS = [
  SORT_ORDER.POPULARITY,
  SORT_ORDER.RATING,
  SORT_ORDER.COMMENTS,
  SORT_ORDER.RELEASED,
];

const MONTHS_RU: Record<string, number> = {
  янв: 0,
  фев: 1,
  мар: 2,
  апр: 3,
  май: 4,
  июн: 5,
  июл: 6,
  авг: 7,
  сен: 8,
  окт: 9,
  ноя: 10,
  дек: 11,
};

/** "9 января 2024" (bare date, no time) — the fork's `dateFormat = "dd MMMM yyyy"`. */
const parseRuFullDate = (text: string | null | undefined): number => {
  const match = /(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i.exec(text?.trim() ?? '');
  if (!match) return 0;
  const day = Number(match[1]);
  const month = MONTHS_RU[match[2]!.toLowerCase().slice(0, 3)];
  if (month === undefined) return 0;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const yearOfEpoch = (epochMs: number): number | null =>
  epochMs ? new Date(epochMs).getFullYear() : null;

/** "Страниц: 16" — printed as plain text on the list row only; getDetails has no such label and
 *  derives the same count from the fetched page-image list instead (see getDetails). */
const parsePagesFromText = (text: string): number | null => {
  const match = /Страниц:\s*(\d+)/.exec(text);
  return match ? Number(match[1]) : null;
};

/** The list row's like count carries no text label of its own (unlike the view count, which has
 *  a "тыс." suffix) — it's the bare number sitting right after the like.png icon in the markup,
 *  so it has to be read off the row's raw HTML rather than its rendered text. */
const parseLikesFromRowHtml = (html: string): number | null => {
  const match = /like\.png[^>]*>\s*(\d+)/i.exec(html);
  return match ? Number(match[1]) : null;
};

/** `#ilike`'s text is the vote button's own label plus the live count ("поставить лайк! 66"),
 *  updated in place by the page's own vote() JS — the count is always the trailing number. */
const parseLikesFromButtonText = (text: string | null): number | null => {
  const match = /(\d+)\s*$/.exec(text?.trim() ?? '');
  return match ? Number(match[1]) : null;
};

/** View counter as the site prints it — "950", "5 тыс.", "1.7 млн." (rounded by the site itself,
 *  so the thousands/millions forms are only as precise as the source makes them). */
const parseViews = (text: string | null | undefined): number | null => {
  const match = /(\d+(?:[.,]\d+)?)\s*(тыс|млн)?/i.exec(text?.trim() ?? '');
  if (!match) return null;
  const value = Number(match[1]!.replace(',', '.'));
  const suffix = match[2]?.toLowerCase();
  const multiplier = suffix === 'млн' ? 1_000_000 : suffix === 'тыс' ? 1_000 : 1;
  return Math.round(value * multiplier);
};

/** The site has no format field of its own — "комикс" and "манхва" are plain tags on it, and
 *  everything else is the Japanese hentai manga the site is named after. */
const mangaTypeOfTags = (tags: RawTag[]): RawTitleType => {
  const titles = new Set(tags.map((tag) => tag.title.toLowerCase()));
  if (titles.has('комикс')) return TITLE_TYPE.COMICS;
  if (titles.has('манхва')) return TITLE_TYPE.MANHWA;
  return TITLE_TYPE.MANGA;
};

/** "AltTitle / MainTitle" split on the site's own `title` attribute, not the link text. */
const splitTitle = (raw: string): { title: string; altTitle: string | null } => {
  const idx = raw.indexOf(' / ');
  if (idx === -1) return { title: raw, altTitle: null };
  return { title: raw.slice(idx + 3), altTitle: nullIfEmpty(raw.slice(0, idx)) };
};

/** Text of the first descendant `<a>` whose `href` contains `hrefSubstr`, or null. */
const textOfLinkContaining = (
  $root: Cheerio<AnyNode>,
  $: CheerioAPI,
  hrefSubstr: string,
): string | null => {
  const match = $root
    .find('a')
    .toArray()
    .find((el) => (attrOrNull($(el), 'href') ?? '').includes(hrefSubstr));
  return match ? textOrNull($(match)) : null;
};

/** Texts of every descendant `<a>` whose `href` contains `hrefSubstr`, deduplicated in order. */
const textsOfLinksContaining = (
  $root: Cheerio<AnyNode>,
  $: CheerioAPI,
  hrefSubstr: string,
): string[] => [
  ...new Set(
    $root
      .find('a')
      .toArray()
      .filter((el) => (attrOrNull($(el), 'href') ?? '').includes(hrefSubstr))
      .map((el) => textOrNull($(el)))
      .filter((text): text is string => !!text),
  ),
];

const parseTagLinks = ($links: Cheerio<AnyNode>, $: CheerioAPI): RawTag[] => {
  const seen = new Set<string>();
  const tags: RawTag[] = [];
  $links.toArray().forEach((el) => {
    const $a = $(el);
    const text = textOrNull($a);
    if (!text) return;
    const href = attrOrNull($a, 'href') ?? '';
    const key = href.split('/').filter(Boolean).pop() ?? text;
    if (seen.has(key)) return;
    seen.add(key);
    tags.push({ title: toTitleCase(text), key, source: SOURCE_ID });
  });
  return tags;
};

export const createNudeMoonParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  void ctx.jar.setCookie(`NMfYa=1; Domain=${domain}; Path=/`, `https://${domain}/`);

  /**
   * `nm_mobile=1` switches the site to its mobile skin, which getDetails/getPages rely on to
   * embed gallery images inline (see the comment on getDetails below). But that same cookie also
   * changes what `all_manga` returns for getList: verified live that the mobile skin's catalog
   * listing silently drops a chunk of titles present in the desktop listing for the exact same
   * `rowstart` window (e.g. under `?views&rowstart=0`, the desktop page lists "The Joy Of
   * Breeding" between "EroNinja №1" and "Debauchery of a Mature Honeypot Princess №2"; the mobile
   * page just skips straight from one to the other) — that's what made the catalog look like it
   * was missing titles compared to the real site. `ctx.jar` is shared by every method on this
   * long-lived parser instance, so the cookie can't be toggled on/off around individual calls
   * without racing concurrent requests; instead give the mobile-only cookie its own jar/client,
   * used solely by getDetails/getPages, and keep it off `ctx.http`'s jar so getList/getFilters
   * always see the complete desktop listing.
   */
  const mobileJar = new CookieJar();
  void mobileJar.setCookie(`NMfYa=1; Domain=${domain}; Path=/`, `https://${domain}/`);
  void mobileJar.setCookie(`nm_mobile=1; Domain=${domain}; Path=/`, `https://${domain}/`);
  const mobileHttp = ctx.createHttpClient ? ctx.createHttpClient(mobileJar) : ctx.http;

  const getSortKey = (order: string | undefined): string => {
    switch (order) {
      case SORT_ORDER.POPULARITY:
        return 'views';
      case SORT_ORDER.RATING:
        return 'like';
      case SORT_ORDER.COMMENTS:
        return 'com';
      case SORT_ORDER.PAGES:
        return 'pages';
      case SORT_ORDER.RELEASED:
      default:
        return 'date';
    }
  };

  /** Entity routes don't support PAGES (see ENTITY_ROUTE_SORT_ORDERS) — falls back to RELEASED's
   *  key rather than sending an unsupported `&pages`, e.g. for a stale deep link. */
  const getEntitySortKey = (order: string | undefined): string =>
    order === SORT_ORDER.PAGES ? getSortKey(undefined) : getSortKey(order);

  const parseMangaRow = (
    $row: Cheerio<AnyNode>,
    $: CheerioAPI,
    baseUrl: string,
  ): RawTitle | null => {
    const $a = $row.find('a').first();
    if ($a.length === 0) return null;
    const hrefRaw = attrOrNull($a, 'href');
    // Filters out non-manga `table.news_pic2` rows sharing the class incidentally (e.g. the
    // popular-tags cloud in the page footer, linking to /tags/...) rather than a manga page.
    if (!hrefRaw || !/^\/\d+-/.test(hrefRaw)) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const { title, altTitle } = splitTitle(attrOrNull($a, 'title') ?? '');
    const author = textOfLinkContaining($row, $, '/mangaka/');
    // The cover thumbnail is lazy-loaded: the list row's `<img>` carries no `src` at all, only
    // `data-src` (verified live — see nudemoon.test.ts LIST_HTML). Fall back to `src` for any
    // markup variant that does set it directly.
    const $img = $row.find('img').first();
    const coverUrl = absUrl($img, 'data-src', baseUrl) ?? absUrl($img, 'src', baseUrl);
    const description = $row.find('.description').first().html();
    const rowText = $row.text();
    // The desktop listing prints "Дата: 17 Сентября 2026" / "Просмотров: 5 тыс." as bare text;
    // the floated span and the view.png icon are the mobile-skin variants of the same values.
    const dateText =
      textOrNull($row.find("span.small2[style*='float:right']").first()) ??
      /Дата:\s*([^\n<]+)/.exec(rowText)?.[1];
    const uploadDate = parseRuFullDate(dateText);
    const viewsText =
      /Просмотров:\s*([^\n<]+)/.exec(rowText)?.[1] ??
      /view\.png[^>]*>(?:\s*<[^>]+>)*\s*([\d.,]+\s*(?:тыс|млн)?)/i.exec($row.html() ?? '')?.[1];
    const tags = parseTagLinks($row.find('.tag-links a'), $);
    const series = textsOfLinksContaining($row, $, '/seria/');

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
      url: relUrl,
      publicUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      tags,
      releaseState: null,
      authors: author ? [author] : [],
      series,
      largeCoverUrl: null,
      description: description ?? null,
      chapters: null,
      type: mangaTypeOfTags(tags),
      year: yearOfEpoch(uploadDate),
      addedAt: uploadDate,
      likes: parseLikesFromRowHtml($row.html() ?? ''),
      views: parseViews(viewsText),
      pages: parsePagesFromText(rowText),
      source: SOURCE_ID,
    };
  };

  /**
   * Joins selected tag keys into the `/tags/` route's own path segment. That route is this DLE
   * fork's "search by multiple genres" form (`form[name="multitags"]`, POST to `/tags/`) — each
   * checked box's value is the tag's display text with a trailing space; verified live that
   * GETting `/tags/<key1>_<key2>_..._` directly (space -> `_`, one `_` per key, no separator
   * between them since each already carries its own) returns the exact listing the form's POST
   * redirects to, so the parser can skip the POST round-trip entirely. Also verified live that the
   * sort query (`?views`/`?like`) has no effect once a tag route is active (order came back
   * byte-identical across sort keys for the same tag), so the tag branch below never threads a
   * sortKey through, only `rowstart` paging. Series/author/group/translator (see
   * ROUTE_EXCLUSIVE_GROUP) are the site's other four browsing axes, each its own single-value
   * route rather than a joinable one like this.
   */
  const tagsPathSegment = (filters: FilterSelection[] | undefined): string | null => {
    const keys = (filters ?? [])
      .filter(
        (f): f is Extract<FilterSelection, { key: string }> =>
          'key' in f && f.groupId === NUDEMOON_FILTER_GROUP.TAG,
      )
      .map((f) => f.key);
    if (keys.length === 0) return null;
    return keys.map((key) => `${encodeURIComponent(key)}_`).join('');
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

  /**
   * `/mangaka/<slug>`, `/seria/<slug>`, `/group/<slug>` and `/perevod/<slug>` are the site's own
   * "browse by X" catalog pages — same `table.news_pic2`/`rowstart` listing template as
   * `all_manga`, one raw row's worth (30) per page. Unlike the tag route, sort *does* change the
   * listing here (verified live: `&views` reorders `/mangaka/asanagi` relative to the bare page),
   * so — unlike tagsPathSegment above — this threads `sortKey` through via `&<sortKey>`.
   */
  const ENTITY_ROUTES: ReadonlyArray<{ groupId: string; path: string }> = [
    { groupId: NUDEMOON_FILTER_GROUP.AUTHOR, path: 'mangaka' },
    { groupId: NUDEMOON_FILTER_GROUP.SERIES, path: 'seria' },
    { groupId: NUDEMOON_FILTER_GROUP.GROUP, path: 'group' },
    { groupId: NUDEMOON_FILTER_GROUP.TRANSLATOR, path: 'perevod' },
  ];

  type Route = { cacheKey: string; urlForRowstart: (rowstart: number) => string };

  const resolveRoute = (
    filters: FilterSelection[] | undefined,
    order: string | undefined,
  ): Route => {
    const tagsSegment = tagsPathSegment(filters);
    if (tagsSegment !== null) {
      return {
        cacheKey: `tags:${tagsSegment}`,
        urlForRowstart: (rowstart) => `https://${domain}/tags/${tagsSegment}&rowstart=${rowstart}`,
      };
    }

    for (const { groupId, path } of ENTITY_ROUTES) {
      const key = findSingleSelection(filters, groupId);
      if (key === null) continue;
      const slug = encodeURIComponent(key);
      const sortKey = getEntitySortKey(order);
      return {
        cacheKey: `${path}:${slug}:${sortKey}`,
        urlForRowstart: (rowstart) =>
          `https://${domain}/${path}/${slug}&${sortKey}&rowstart=${rowstart}`,
      };
    }

    const sortKey = getSortKey(order);
    return {
      cacheKey: `sort:${sortKey}`,
      urlForRowstart: (rowstart) => `https://${domain}/all_manga?${sortKey}&rowstart=${rowstart}`,
    };
  };

  const fetchRowstart = async (url: string): Promise<RawTitle[]> => {
    const doc = await ctx.http.getHtml(url);
    return doc
      .$('table.news_pic2')
      .toArray()
      .map((el) => parseMangaRow(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawTitle => m !== null);
  };

  /**
   * `rowstart` indexes the site's *raw* rows, but `all_manga` collapses multi-chapter series
   * under RELEASED/RATING sort so raw rows only yield a handful of unique cards per ROWSTART_STEP
   * window (POPULARITY doesn't seem to do this). Raw row index and collapsed card index therefore
   * drift apart — treating an API offset (in cards) as a fresh `rowstart` (in raw rows) for every
   * page request re-scans raw rows already consumed by an earlier page, and since dedup was
   * previously scoped per-request, already-shown titles reappeared on the next page.
   *
   * Instead, keep one running, globally-deduplicated card list per sort order (parser instances
   * are long-lived — see registry.ts) and grow it by advancing `rowstart` from wherever the last
   * scan left off, never re-issuing a `rowstart` already consumed. A short response isn't
   * reliably "end of catalog" here (unlike the offset-native sources this used to share
   * `fetchOffsetNative` with) — the caller (catalog.service.ts) infers `hasNext` from
   * `items.length >= PAGE_SIZE`, so treat only a genuinely empty window as the end.
   *
   * That "never re-issue a consumed rowstart" rule makes an already-scanned window permanent —
   * new uploads that land ahead of it on the live site (or existing titles the site reordered
   * into it) would otherwise never be seen again for the rest of the process's life, no matter
   * how often the Redis layer in front of this (apps/api CacheService) re-invokes getList(): that
   * cache only decides *when* to call getList() again, it has no visibility into this closure's Map
   * and can't clear it. So expire the whole per-key cache after CATALOG_CACHE_TTL_MS and rescan
   * from rowstart=0 — long enough to keep one paging session's dedup intact, short enough that the
   * catalog stops drifting from the live site.
   */
  type CatalogCache = {
    items: RawTitle[];
    seen: Set<number>;
    nextRowstart: number;
    exhausted: boolean;
    createdAt: number;
  };
  const catalogCaches = new Map<string, CatalogCache>();

  const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;

  /** Safety valve in case the site's empty-window end-of-catalog signal never fires for a single
   *  pathological request; far beyond what one page's worth of scanning should ever need. */
  const MAX_HOPS_PER_CALL = 300;

  const ensureCatalogItems = async (
    cacheKey: string,
    minCount: number,
    urlForRowstart: (rowstart: number) => string,
  ): Promise<RawTitle[]> => {
    let cache = catalogCaches.get(cacheKey);
    if (cache && Date.now() - cache.createdAt >= CATALOG_CACHE_TTL_MS) {
      cache = undefined;
    }
    if (!cache) {
      cache = {
        items: [],
        seen: new Set(),
        nextRowstart: 0,
        exhausted: false,
        createdAt: Date.now(),
      };
      catalogCaches.set(cacheKey, cache);
    }
    for (
      let hops = 0;
      cache.items.length < minCount && !cache.exhausted && hops < MAX_HOPS_PER_CALL;
      hops += 1
    ) {
      const rowstart = cache.nextRowstart;
      cache.nextRowstart += ROWSTART_STEP;
      const batch = await fetchRowstart(urlForRowstart(rowstart));
      if (batch.length === 0) {
        cache.exhausted = true;
        break;
      }
      for (const item of batch) {
        if (cache.seen.has(item.id)) continue;
        cache.seen.add(item.id);
        cache.items.push(item);
      }
    }
    return cache.items;
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    if (params.query) {
      throw new SourceAuthRequiredError(
        `Search requires an authenticated session: query="${params.query}"`,
        SOURCE_ID,
      );
    }
    const { cacheKey, urlForRowstart } = resolveRoute(params.filters, params.order);
    const items = await ensureCatalogItems(cacheKey, params.offset + params.limit, urlForRowstart);
    return items.slice(params.offset, params.offset + params.limit);
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await mobileHttp.getHtml(absoluteUrl);
    const root = doc.$('table.news_pic2').first();
    if (root.length === 0)
      throw new ParseError(`Cannot find table.news_pic2: ${absoluteUrl}`, SOURCE_ID);

    // The mobile details page's only titled links are the author/series/translator ones
    // ("Показать всю мангу от ...") — the title itself lives in the page's `<h1>`, in the same
    // "AltTitle / MainTitle" form the listing puts in its link `title`.
    const { title, altTitle } = splitTitle(textOrNull(doc.$('h1').first()) ?? '');

    // The mobile skin (forced via the nm_mobile cookie set above) embeds every page image of the
    // gallery as `img[data-src]` right on this same details page — so both the cover placeholder
    // and the source's own page count fall out of the same query, no separate reader fetch needed.
    const $pageImages = doc.$('img[data-src]');
    if ($pageImages.length === 0)
      throw new ParseError(`Cover image not found: ${absoluteUrl}`, SOURCE_ID);
    const largeCoverUrl = absUrl($pageImages.first(), 'data-src', doc.baseUrl);

    const authors = textsOfLinksContaining(root, doc.$, '/mangaka/');
    const series = textsOfLinksContaining(root, doc.$, '/seria/');
    const translators = textsOfLinksContaining(root, doc.$, '/perevod/');
    const timeIcon = doc.$('img[src$="ico/time.png"]').first();
    const uploadDate = parseRuFullDate(textOrNull(timeIcon.next()));
    const viewIcon = doc.$('img[src$="ico/view.png"]').first();
    const views = parseViews(textOrNull(viewIcon.next()));
    const likes = parseLikesFromButtonText(textOrNull(doc.$('#ilike').first()));

    const description = root.find('.description').first().html();
    const tags = parseTagLinks(root.find('a[href*="/tag/"]'), doc.$);

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: null,
      largeCoverUrl,
      tags,
      releaseState: null,
      authors,
      series,
      translators,
      description: description ?? null,
      chapters: [
        {
          id: generateUid(SOURCE_ID, mangaUrl),
          url: mangaUrl,
          title,
          number: 0,
          volume: 0,
          scanlator: translators.length > 0 ? translators.join(', ') : null,
          uploadDate,
          branch: null,
          source: SOURCE_ID,
        },
      ],
      type: mangaTypeOfTags(tags),
      year: yearOfEpoch(uploadDate),
      addedAt: uploadDate,
      likes,
      views,
      pages: $pageImages.length,
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const absoluteUrl = toAbsoluteUrl(chapterUrl, domain);
    const doc = await mobileHttp.getHtml(absoluteUrl);
    return doc
      .$('img[data-src]')
      .toArray()
      .map((el): RawPage | null => {
        const raw = attrOrNull(doc.$(el), 'data-src');
        if (!raw) return null;
        const url = toAbsoluteUrl(raw, domain);
        return { id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID };
      })
      .filter((p): p is RawPage => p !== null);
  };

  /**
   * `/tags/` is a standalone "search by genres" page — a `form[name="multitags"]` checkbox list,
   * one request returns the full set (~100 tags) with no pagination. Each checkbox's `value`
   * attribute is the tag's own display text (with a trailing space, stripped here) — the same
   * text `tagsPathSegment` re-encodes when a selection comes back through `getList`.
   *
   * `/mangaka/`, `/seria/`, `/group/` and `/perevod/` are the site's other four "browse by X"
   * index pages. Each lists every entity as a two-cell row — `<a href="/<route>/<slug>"
   * title="<Name>">` plus a title-count in the next `<td>` — parseEntityOptions below reads both
   * off that shared (if HTML-soup) template.
   */
  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const parseEntityOptions = (doc: { $: CheerioAPI }, routePath: string): RawFilterOption[] => {
    const prefix = `/${routePath}/`;
    const seen = new Set<string>();
    const options: RawFilterOption[] = [];
    doc
      .$(`a[href^="${prefix}"]`)
      .toArray()
      .forEach((el) => {
        const $a = doc.$(el);
        const href = attrOrNull($a, 'href') ?? '';
        if (href.includes('?')) return;
        const title = (attrOrNull($a, 'title') ?? '').trim();
        const key = href.slice(prefix.length).trim();
        if (!title || !key || seen.has(key)) return;
        seen.add(key);
        const countMatch = /\d+/.exec($a.closest('tr').find('td').eq(1).text());
        options.push({ key, title, count: countMatch ? Number(countMatch[0]) : null });
      });
    return options;
  };

  /**
   * `/group/`'s own `?letter=all` bucket — unlike the identical param on `/mangaka/` and
   * `/seria/`, which each return their full multi-thousand-row listing in one page — comes back
   * empty (verified live, reproducibly; a site-side quirk of that one route). Fall back to
   * walking the site's own A-Z/0-9 letter index and merging the pages instead. Any entry filed
   * under neither a latin letter nor a digit is unreachable this way — the same gap the site's
   * own "#" button has, since it points at the same broken `letter=all`.
   */
  const LETTER_BUCKETS = [
    '0',
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  ];

  const fetchGroupOptions = async (): Promise<RawFilterOption[]> => {
    const docs = await Promise.all(
      LETTER_BUCKETS.map((letter) => ctx.http.getHtml(`https://${domain}/group/?letter=${letter}`)),
    );
    const seen = new Set<string>();
    const options: RawFilterOption[] = [];
    for (const doc of docs) {
      for (const option of parseEntityOptions(doc, 'group')) {
        if (seen.has(option.key)) continue;
        seen.add(option.key);
        options.push(option);
      }
    }
    return options;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const [tagsDoc, seriesDoc, authorDoc, translatorDoc, groupOptions] = await Promise.all([
      ctx.http.getHtml(`https://${domain}/tags/`),
      ctx.http.getHtml(`https://${domain}/seria/?letter=all`),
      ctx.http.getHtml(`https://${domain}/mangaka/?letter=all`),
      ctx.http.getHtml(`https://${domain}/perevod/`),
      fetchGroupOptions(),
    ]);

    const tagOptions: RawFilterOption[] = tagsDoc
      .$('form[name="multitags"] input[type="checkbox"]')
      .toArray()
      .map((el): RawFilterOption | null => {
        const value = (attrOrNull(tagsDoc.$(el), 'value') ?? '').trim();
        if (!value) return null;
        return { key: value, title: toTitleCase(value), count: null };
      })
      .filter((o): o is RawFilterOption => o !== null);

    const seriesOptions = parseEntityOptions(seriesDoc, 'seria');
    const authorOptions = parseEntityOptions(authorDoc, 'mangaka');
    const translatorOptions = parseEntityOptions(translatorDoc, 'perevod');

    const groups: RawFilterGroup[] = [];
    if (tagOptions.length > 0) {
      groups.push({
        id: NUDEMOON_FILTER_GROUP.TAG,
        title: 'Теги',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX,
        options: tagOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
      });
    }
    if (seriesOptions.length > 0) {
      groups.push({
        id: NUDEMOON_FILTER_GROUP.SERIES,
        title: 'Серии',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: seriesOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: ENTITY_ROUTE_SORT_ORDERS,
      });
    }
    if (authorOptions.length > 0) {
      groups.push({
        id: NUDEMOON_FILTER_GROUP.AUTHOR,
        title: 'Авторы',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: authorOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: ENTITY_ROUTE_SORT_ORDERS,
      });
    }
    if (groupOptions.length > 0) {
      groups.push({
        id: NUDEMOON_FILTER_GROUP.GROUP,
        title: 'Группы и циклы',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: groupOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: ENTITY_ROUTE_SORT_ORDERS,
      });
    }
    if (translatorOptions.length > 0) {
      groups.push({
        id: NUDEMOON_FILTER_GROUP.TRANSLATOR,
        title: 'Переводчики',
        type: FILTER_TYPE.SEARCHABLE_RADIO,
        options: translatorOptions,
        exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
        sortOrders: ENTITY_ROUTE_SORT_ORDERS,
      });
    }
    return groups;
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Nude-Moon',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.HENTAI,
      isBroken: false,
      isAdult: true,
      requiresVpn: true,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.RATING,
        SORT_ORDER.PAGES,
        SORT_ORDER.COMMENTS,
        SORT_ORDER.RELEASED,
      ],
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

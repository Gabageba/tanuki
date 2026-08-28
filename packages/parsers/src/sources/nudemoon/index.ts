import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { CONTENT_RATING, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import type { RawManga, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { toTitleCase, nullIfEmpty } from '../../core/text/strings';
import { ParseError, SourceAuthRequiredError } from '../../errors';

const SOURCE_ID = 'NUDEMOON';
/** The site's own `all_manga` pager advances `rowstart` by 30 raw rows per page. */
const ROWSTART_STEP = 30;

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
  void ctx.jar.setCookie(`nm_mobile=1; Domain=${domain}; Path=/`, `https://${domain}/`);

  const getSortKey = (order: string | undefined): string => {
    switch (order) {
      case 'POPULARITY':
        return 'views';
      case 'RATING':
        return 'like';
      case 'NEWEST':
      default:
        return 'date';
    }
  };

  const parseMangaRow = (
    $row: Cheerio<AnyNode>,
    $: CheerioAPI,
    baseUrl: string,
  ): RawManga | null => {
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
    const $img = $row.find('img').first();
    const coverUrl = attrOrNull($img, 'src') ? absUrl($img, 'src', baseUrl) : null;
    const description = $row.find('.description').first().html();

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
      url: relUrl,
      publicUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      tags: parseTagLinks($row.find('.tag-links a'), $),
      state: null,
      authors: author ? [author] : [],
      largeCoverUrl: null,
      description: description ?? null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const fetchRowstart = async (rowstart: number, sortKey: string): Promise<RawManga[]> => {
    const url = `https://${domain}/all_manga?${sortKey}&rowstart=${rowstart}`;
    const doc = await ctx.http.getHtml(url);
    return doc
      .$('table.news_pic2')
      .toArray()
      .map((el) => parseMangaRow(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  /**
   * `rowstart` indexes the site's *raw* rows, but `all_manga` collapses multi-chapter series
   * under NEWEST/RATING sort so raw rows only yield a handful of unique cards per ROWSTART_STEP
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
   */
  type CatalogCache = {
    items: RawManga[];
    seen: Set<number>;
    nextRowstart: number;
    exhausted: boolean;
  };
  const catalogCaches = new Map<string, CatalogCache>();

  /** Safety valve in case the site's empty-window end-of-catalog signal never fires for a single
   *  pathological request; far beyond what one page's worth of scanning should ever need. */
  const MAX_HOPS_PER_CALL = 300;

  const ensureCatalogItems = async (sortKey: string, minCount: number): Promise<RawManga[]> => {
    let cache = catalogCaches.get(sortKey);
    if (!cache) {
      cache = { items: [], seen: new Set(), nextRowstart: 0, exhausted: false };
      catalogCaches.set(sortKey, cache);
    }
    for (
      let hops = 0;
      cache.items.length < minCount && !cache.exhausted && hops < MAX_HOPS_PER_CALL;
      hops += 1
    ) {
      const rowstart = cache.nextRowstart;
      cache.nextRowstart += ROWSTART_STEP;
      const batch = await fetchRowstart(rowstart, sortKey);
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

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    if (params.query) {
      throw new SourceAuthRequiredError('Search requires an authenticated session', SOURCE_ID);
    }
    const sortKey = getSortKey(params.order);
    const items = await ensureCatalogItems(sortKey, params.offset + params.limit);
    return items.slice(params.offset, params.offset + params.limit);
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const root = doc.$('table.news_pic2').first();
    if (root.length === 0) throw new ParseError('Cannot find table.news_pic2', SOURCE_ID);

    const $titleLink = root.find('a[title]').first();
    const { title, altTitle } = splitTitle(attrOrNull($titleLink, 'title') ?? '');

    const $cover = doc.$('img[data-src]').first();
    if ($cover.length === 0) throw new ParseError('Cover image not found', SOURCE_ID);
    const largeCoverUrl = absUrl($cover, 'data-src', doc.baseUrl);

    const author = textOfLinkContaining(root, doc.$, '/mangaka/');
    const scanlator = textOfLinkContaining(root, doc.$, '/perevod/');
    const timeIcon = doc.$('img[src$="ico/time.png"]').first();
    const uploadDate = parseRuFullDate(textOrNull(timeIcon.next()));

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
      state: null,
      authors: author ? [author] : [],
      description: description ?? null,
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

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Nude-Moon',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.hentai,
      isBroken: false,
      isAdult: true,
      requiresVpn: true,
      sortOrders: ['NEWEST', 'POPULARITY', 'RATING'],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: false,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

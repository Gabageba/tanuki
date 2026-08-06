import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { CONTENT_RATING } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawChapter, RawManga, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { catalogEntryFor } from '../catalog';
import type { MultpornConfig } from './config';

const BROWSE_PAGE_SIZE = 15;
/** `/search`'s native Views page size — verified against several live queries, always 20 rows
 *  regardless of how many of them end up matching this source's `pathPrefix`. */
const SEARCH_RAW_PAGE_SIZE = 20;

const IMG_SRC_RE = /<img[^>]*\ssrc="([^"]+)"/g;

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
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      tags: parseCategoryLinks($row.find(cfg.listTagSelector), $, cfg.id),
      state: null,
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: cfg.id,
    };
  };

  const buildBrowseUrl = (page: number): string => {
    const url = new URL('/new', `https://${domain}/`);
    url.searchParams.set('type', cfg.typeParam);
    url.searchParams.set('language', 'All');
    url.searchParams.set('field_user_discription_value', 'All');
    url.searchParams.set('sort_by', 'changed');
    url.searchParams.set('sort_order', 'DESC');
    url.searchParams.set('page', String(page));
    return url.toString();
  };

  const fetchBrowsePage = async (page: number): Promise<RawManga[]> => {
    const doc = await ctx.http.getHtml(buildBrowseUrl(page));
    return doc
      .$('.view-content .masonry-item')
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
    return fetchPaged(params, { size: BROWSE_PAGE_SIZE, firstPage: 0 }, (page) =>
      fetchBrowsePage(page),
    );
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
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      largeCoverUrl: coverUrl,
      tags,
      state: null,
      authors: author ? [author] : [],
      description,
      chapters: [chapter],
      source: cfg.id,
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
      locale: 'en',
      contentType: catalogEntryFor(cfg.id).contentType,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      sortOrders: ['NEWEST'],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

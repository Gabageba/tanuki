import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchOffsetNative } from '../../core/paging';
import type { RawManga, RawChapter, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { parseGroupleDate } from '../../core/text/dates';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { catalogEntryFor } from '../catalog';
import type { ChanConfig } from './config';

/**
 * The site's search endpoint pages results in fixed 40-item blocks (`result_num=40`,
 * `search_start=offset/40+1`) — this size is a param we control, so it's trustworthy.
 * Plain browse listings (`/manga/new`, `/mostviews`, ...) are NOT paged by that param — live
 * checks against manga-chan.me and hentaichan.live both show 20 items per native page there,
 * regardless of offset. Using 40 for browse made fetchOffsetNative's short-page break trigger
 * after a single (20-item) fetch, so any API page beyond the first sliced past the end of the
 * fetched batch and silently returned []. Keep the two sizes distinct instead of reusing one
 * constant for both.
 */
const SEARCH_NATIVE_SIZE = 40;
const BROWSE_NATIVE_SIZE = 20;

function toTagName(raw: string): string {
  const spaced = raw.replace(/_/g, ' ');
  return spaced
    .split(' ')
    .map((word) =>
      word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
}

/**
 * DLE listing titles are formatted "Alt Title (Primary Title)" — the trailing balanced
 * parenthetical is the primary title, the text before it the alt title. Ported from
 * ChanParser.parseTitle.
 */
function parseTitle(raw: string): { title: string; altTitle: string | null } {
  let depth = 0;
  const lastIndex = raw.length - 1;
  for (let i = lastIndex; i >= 0; i -= 1) {
    const ch = raw[i];
    if (ch === '(') {
      depth -= 1;
      if (depth === 0 && i + 2 < lastIndex && i > 0) {
        return {
          title: raw.slice(i + 1, lastIndex).trim(),
          altTitle: nullIfEmpty(raw.slice(0, i).trim()),
        };
      }
    } else if (ch === ')') {
      depth += 1;
    }
  }
  return { title: raw, altTitle: null };
}

function cutBeforeTrailingDiv(html: string): string {
  const idx = html.lastIndexOf('<div');
  return idx === -1 ? html : html.slice(0, idx);
}

/**
 * `"fullimg"` script marker precedes a bare JS array of quoted image paths:
 * `var pictures = "fullimg" ... ["001.jpg","002.jpg"];`. Ported from ChanParser.getPages —
 * extracts the array body (after the first `[`, before `;`, before the last `]`) and splits on
 * comma; each token can be single- or double-quoted.
 */
function extractFullImgPaths(scriptText: string): string[] | null {
  const markerPos = scriptText.indexOf('"fullimg');
  if (markerPos === -1) return null;
  const tail = scriptText.slice(markerPos);
  const openBracket = tail.indexOf('[');
  if (openBracket === -1) return null;
  let inner = tail.slice(openBracket + 1);
  const semicolon = inner.indexOf(';');
  if (semicolon !== -1) inner = inner.slice(0, semicolon);
  const closeBracket = inner.lastIndexOf(']');
  if (closeBracket !== -1) inner = inner.slice(0, closeBracket);
  return inner
    .split(',')
    .map((token) => {
      const trimmed = token.trim();
      const match = /^"(.*)"$/.exec(trimmed) ?? /^'(.*)'$/.exec(trimmed);
      return (match ? match[1]! : trimmed).trim();
    })
    .filter((s) => s.length > 0);
}

function buildListUrl(
  cfg: ChanConfig,
  domain: string,
  offset: number,
  order: string | undefined,
  query: string | undefined,
): string {
  const url = new URL(`https://${domain}/`);
  url.searchParams.set('offset', String(offset));

  if (query) {
    url.searchParams.set('do', 'search');
    url.searchParams.set('subaction', 'search');
    url.searchParams.set('search_start', String(Math.floor(offset / SEARCH_NATIVE_SIZE) + 1));
    url.searchParams.set('full_search', '0');
    url.searchParams.set('result_from', String(offset + 1));
    url.searchParams.set('result_num', String(SEARCH_NATIVE_SIZE));
    url.searchParams.set('story', query);
    url.searchParams.set('need_sort_date', 'false');
    return url.toString();
  }

  if (cfg.variant === 'henchan') {
    switch (order) {
      case 'POPULARITY':
        url.pathname = '/mostviews';
        url.searchParams.set('sort', 'manga');
        break;
      case 'RATING':
        url.pathname = '/mostfavorites';
        url.searchParams.set('sort', 'manga');
        break;
      default:
        url.pathname = '/manga/newest';
    }
    return url.toString();
  }

  switch (order) {
    case 'POPULARITY':
      url.pathname = '/mostviews';
      break;
    case 'ALPHABETICAL':
      url.pathname = '/catalog';
      break;
    case 'RATING':
      url.pathname = '/mostfavorites';
      break;
    default:
      url.pathname = '/manga/new';
  }
  return url.toString();
}

export function createChanParser(cfg: ChanConfig, ctx: ParserContext): Parser {
  const domain = ctx.domain;

  function parseMangaRow($row: Cheerio<AnyNode>, $: CheerioAPI, baseUrl: string): RawManga | null {
    const $a = $row.find('div.manga_row1 h2 a').first();
    if ($a.length === 0) return null;
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw) return null;
    let publicUrl: string;
    try {
      publicUrl = new URL(hrefRaw, baseUrl).toString();
    } catch {
      return null;
    }
    const relUrl = toRelativeUrl(publicUrl, domain);
    const { title, altTitle } = parseTitle(textOrNull($a) ?? '');
    const author = textOrNull($row.find('a[href^="/mangaka"]').first());
    const $img = $row.find('div.manga_images img').first();
    const coverUrl = attrOrNull($img, 'src') ? absUrl($img, 'src', baseUrl) : null;
    const tags: RawTag[] = $row
      .find('div.genre a')
      .toArray()
      .map((el) => {
        const $el = $(el);
        const text = textOrNull($el);
        if (!text) return null;
        const hrefAttr = attrOrNull($el, 'href') ?? '';
        const rawKey = hrefAttr.split('/').filter(Boolean).pop() ?? text;
        let key = rawKey;
        try {
          key = decodeURIComponent(rawKey);
        } catch {
          /* keep raw key */
        }
        return { title: toTagName(text), key, source: cfg.id };
      })
      .filter((t): t is RawTag => t !== null);

    return {
      id: generateUid(cfg.id, relUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
      url: relUrl,
      publicUrl,
      rating: RATING_UNKNOWN,
      contentRating: cfg.isNsfw ? 'ADULT' : null,
      coverUrl,
      tags,
      state: null,
      authors: author ? [author] : [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: cfg.id,
    };
  }

  async function fetchListPage(
    offset: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<RawManga[]> {
    const url = buildListUrl(cfg, domain, offset, order, query);
    const doc = await ctx.http.getHtml(url);
    const root = doc.$('div.main_fon').find('#content').first();
    if (root.length === 0) {
      throw new ParseError('Cannot find root', cfg.id);
    }
    return root
      .find('div.content_row')
      .toArray()
      .map((el) => parseMangaRow(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  }

  async function getList(params: ListParams): Promise<RawManga[]> {
    const size = params.query ? SEARCH_NATIVE_SIZE : BROWSE_NATIVE_SIZE;
    return fetchOffsetNative(params, { size }, (offset) =>
      fetchListPage(offset, params.order, params.query),
    );
  }

  function parseDefaultChapters($root: Cheerio<AnyNode>, $: CheerioAPI): RawChapter[] {
    const rows = $root.find('table.table_cha tr').toArray().slice(2).reverse();
    const chapters: RawChapter[] = [];
    rows.forEach((el, index) => {
      const $tr = $(el);
      const $a = $tr.find('a').first();
      const hrefRaw = attrOrNull($a, 'href');
      if (!hrefRaw) return;
      const relUrl = toRelativeUrl(toAbsoluteUrl(hrefRaw, domain), domain);
      chapters.push({
        id: generateUid(cfg.id, relUrl),
        title: textOrNull($a),
        number: index + 1,
        volume: 0,
        url: relUrl,
        scanlator: null,
        uploadDate: parseGroupleDate(textOrNull($tr.find('div.date').first())),
        branch: null,
        source: cfg.id,
      });
    });
    return chapters;
  }

  function parseYaoichanChapters($root: Cheerio<AnyNode>, $: CheerioAPI): RawChapter[] {
    const rows = $root.find('table.table_cha div.manga').toArray().reverse();
    const chapters: RawChapter[] = [];
    rows.forEach((el, index) => {
      const $a = $(el).find('a').first();
      const hrefRaw = attrOrNull($a, 'href');
      if (!hrefRaw) return;
      const relUrl = toRelativeUrl(toAbsoluteUrl(hrefRaw, domain), domain);
      chapters.push({
        id: generateUid(cfg.id, relUrl),
        title: textOrNull($a),
        number: index + 1,
        volume: 0,
        url: relUrl,
        scanlator: null,
        uploadDate: 0,
        branch: null,
        source: cfg.id,
      });
    });
    return chapters;
  }

  function henchanChapters(mangaUrl: string): RawChapter[] {
    const readLink = mangaUrl.split('manga').join('online');
    return [
      {
        id: generateUid(cfg.id, readLink),
        title: null,
        number: 0,
        volume: 0,
        url: readLink,
        scanlator: null,
        uploadDate: 0,
        branch: null,
        source: cfg.id,
      },
    ];
  }

  async function getDetails(mangaUrl: string): Promise<RawManga> {
    const absoluteUrl = new URL(mangaUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const root = doc.$('#dle-content').first();
    if (root.length === 0) {
      throw new ParseError('Cannot find #dle-content', cfg.id);
    }

    const descHtml = root.find('#description').first().html();
    const description = descHtml ? cutBeforeTrailingDiv(descHtml) : null;
    const $cover = root.find('#cover').first();
    let coverUrl = attrOrNull($cover, 'src') ? absUrl($cover, 'src', doc.baseUrl) : null;
    const { title, altTitle } = parseTitle(textOrNull(root.find('h1').first()) ?? '');
    const author = textOrNull(root.find('a[href^="/mangaka"]').first());
    const tags: RawTag[] = root
      .find('div.sidetags li.sidetag')
      .toArray()
      .map((el) => {
        const $a = doc.$(el).children().last();
        const text = textOrNull($a);
        if (!text) return null;
        const hrefAttr = attrOrNull($a, 'href') ?? '';
        const rawKey = hrefAttr.split('/').filter(Boolean).pop() ?? text;
        let key = rawKey;
        try {
          key = decodeURIComponent(rawKey);
        } catch {
          /* keep raw key */
        }
        return { title: toTagName(text), key, source: cfg.id };
      })
      .filter((t): t is RawTag => t !== null);

    const chapters =
      cfg.variant === 'henchan'
        ? henchanChapters(mangaUrl)
        : cfg.variant === 'yaoichan'
          ? parseYaoichanChapters(root, doc.$)
          : parseDefaultChapters(root, doc.$);

    // Some listings ship an empty `#cover` src (content gap on the source's own details
    // template, not a selector miss — verified against live HTML). The reader's first page is
    // always populated for the same manga, so it's a reliable substitute cover.
    if (!coverUrl && chapters.length > 0) {
      try {
        const firstChapterPages = await getPages(chapters[0]!.url);
        coverUrl = firstChapterPages[0]?.url ?? null;
      } catch {
        // leave coverUrl null — a missing cover shouldn't fail the whole getDetails call
      }
    }

    return {
      id: generateUid(cfg.id, mangaUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      contentRating: cfg.isNsfw ? 'ADULT' : null,
      coverUrl,
      tags,
      state: null,
      authors: author ? [author] : [],
      largeCoverUrl: coverUrl,
      description,
      chapters,
      source: cfg.id,
    };
  }

  async function getPages(chapterUrl: string): Promise<RawPage[]> {
    const absoluteUrl = new URL(chapterUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const scripts = doc
      .$('script')
      .toArray()
      .map((el) => doc.$(el).html() ?? '');
    for (const data of scripts) {
      const paths = extractFullImgPaths(data);
      if (!paths) continue;
      return paths.map((token) => {
        const url = toAbsoluteUrl(token, domain);
        return { id: generateUid(cfg.id, url), url, preview: null, source: cfg.id };
      });
    }
    throw new ParseError(`Pages list not found at ${chapterUrl}`, cfg.id);
  }

  return {
    id: cfg.id,
    info: {
      id: cfg.id,
      title: catalogEntryFor(cfg.id).title,
      locale: 'ru',
      contentType: cfg.isNsfw ? 'HENTAI' : 'MANGA',
      isBroken: false,
      sortOrders: cfg.sortOrders,
      isSearchSupported: true,
      isMultipleTagsSupported: true,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
}

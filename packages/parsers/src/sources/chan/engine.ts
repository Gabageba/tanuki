import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_STATE,
  TITLE_TYPE,
  SORT_DIRECTION,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  SOURCE_LOCALE,
  type TitleState,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchOffsetNative } from '../../core/paging';
import type {
  RawTitle,
  RawChapter,
  RawPage,
  RawTag,
  RawFilterGroup,
  RawFilterOption,
  RawTitleType,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { parseGroupleDate } from '../../core/text/dates';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { FILTER_GROUP } from '../../core/filters/group';
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

/**
 * Tags, "Тип" and "Статус" are three separate top-level routes on this DLE engine — verified
 * live that none of them combine (`/type/X/tags/Y`, `/tags/Y/type/X`, `/catalog/ongoing/tags/Y`
 * all 404; a `?tags=` query tacked onto `/type/X` is silently ignored, not applied). Tagging all
 * three RawFilterGroups with the same exclusiveGroup lets the UI enforce "pick one axis" instead
 * of silently dropping whichever the parser doesn't route to.
 */
const ROUTE_EXCLUSIVE_GROUP = 'route';

export const CHAN_FILTER_GROUP = {
  TAG: FILTER_GROUP.TAG,
  TYPE: FILTER_GROUP.TYPE,
  STATUS: FILTER_GROUP.STATUS,
} as const;

const toTagName = (raw: string): string => {
  const spaced = raw.replace(/_/g, ' ');
  return spaced
    .split(' ')
    .map((word) =>
      word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
};

/**
 * DLE listing titles are formatted "Alt Title (Primary Title)" — the trailing balanced
 * parenthetical is the primary title, the text before it the alt title. Ported from
 * ChanParser.parseTitle.
 */
const parseTitle = (raw: string): { title: string; altTitle: string | null } => {
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
};

/** Last non-empty path segment of an href, percent-decoded when possible — shared by every place
 *  that turns a tag/genre `<a>` into a `{ key, title }` pair (list rows, details, tag cloud). */
const parseHrefKey = (hrefAttr: string | null, fallback: string): string => {
  const rawKey = (hrefAttr ?? '').split('/').filter(Boolean).pop() ?? fallback;
  try {
    return decodeURIComponent(rawKey);
  } catch {
    return rawKey;
  }
};

/** `title="Найдено новостей: 2070"` on the tag cloud page — the source's own per-tag count. */
const parseCountFromTitle = (title: string | null): number | null => {
  const match = title ? /\d+/.exec(title) : null;
  return match ? Number.parseInt(match[0], 10) : null;
};

/**
 * This DLE engine has no bounded rating (no 0..10 or 0..5 scale, no downvotes) — the only
 * per-title score is an unbounded "likes" tally, rendered as "Плюсиков: N" on manga-chan.me (list
 * row and details alike) or "N плюсиков" inline on hentaichan.live's list row. Both phrasings are
 * checked since the wording differs by skin; RawTitle.likes carries this separately from `rating`
 * (which stays RATING_UNKNOWN — see RawTitle.likes doc on why the two can't be merged).
 */
const parseLikesFromText = (text: string): number | null => {
  const match = /Плюсиков:\s*(\d+)/i.exec(text) ?? /(\d+)\s*плюсик/i.exec(text);
  return match ? Number.parseInt(match[1]!, 10) : null;
};

/** `table.mangatitle` on the details page is a flat `td.item`/`td.item2` label-value list ("Тип",
 *  "Автор", "Другие названия", ...) — this finds the value cell for one label, or null when the
 *  row isn't rendered for this title (e.g. "Переводчики" is absent on untranslated releases). */
const findInfoCell = ($root: Cheerio<AnyNode>, $: CheerioAPI, label: string): Cheerio<AnyNode> => {
  const row = $root
    .find('table.mangatitle tr')
    .toArray()
    .find((el) => (textOrNull($(el).find('td.item').first()) ?? '').trim() === label);
  return row ? $(row).find('td.item2').first() : $();
};

/** "Тип" cell links to `/type/<name>` — same vocabulary as `fetchTypeGroup`'s `/type/` listing
 *  (verified live: Манга, Манхва, Маньхуа, Комикс, OEL Manga, OEL-манга, Другое, Новелла, Ранобэ,
 *  Руманга, Стрип). Only the four RawTitleType-bearing ones get their own case. */
const parseChanType = (text: string | null): RawTitleType | null => {
  switch (text?.trim()) {
    case 'Манга':
      return TITLE_TYPE.MANGA;
    case 'Манхва':
      return TITLE_TYPE.MANHWA;
    case 'Маньхуа':
      return TITLE_TYPE.MANHUA;
    case 'Комикс':
      return TITLE_TYPE.COMICS;
    case undefined:
    case '':
      return null;
    default:
      return TITLE_TYPE.OTHER;
  }
};

/** Shared by "Статус (Томов)" (original release) and "Загружено" (translation) cells — both
 *  phrase their state as "... завершен" / "... продолжается" (verified live across regular
 *  series, a completed oneshot and an ongoing one); this DLE engine has no third state (no
 *  paused/abandoned wording observed anywhere, including the site's own `/catalog` status
 *  filters — see fetchStatusGroup, which only ever routes `all_done`/`end`/`ongoing`). */
const parseChanState = (text: string | null): TitleState | null => {
  if (!text) return null;
  if (/заверш/i.test(text)) return TITLE_STATE.FINISHED;
  if (/продолжа/i.test(text)) return TITLE_STATE.ONGOING;
  return null;
};

/** "Статус (Томов)" reads "Сингл" instead of a "выпуск ..." phrase for a one-shot — a single
 *  release has nothing left to publish, so it's complete by definition even though the cell
 *  never spells out "завершен" for it. */
const parseChanReleaseState = (text: string | null): TitleState | null => {
  if (text && /^\s*сингл/i.test(text)) return TITLE_STATE.FINISHED;
  return parseChanState(text);
};

/** "Другие названия" packs every alt title into one cell, separated by whichever punctuation the
 *  title's editor happened to use — verified live as both "; " (One Piece's ~25-entry list) and
 *  " / " (a Korean manhwa's list) on different titles, never mixed on the same one. Splitting on
 *  either covers both without a per-title lookup table. */
const parseChanAltTitles = (text: string | null): string[] => {
  if (!text) return [];
  return text
    .split(/[;/]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
};

/** "Автор" / "Переводчики" cells link every credited person as `<a href="/mangaka/<id>/">` /
 *  `<a href="/translation/<id>/">`, plus one trailing empty `<a href="/mangaka/">` placeholder
 *  the source's own template always appends (verified live on every sampled title) — filtered out
 *  here by its empty text rather than by href, since a real credit could theoretically share the
 *  same bare prefix. */
const parseChanCredits = ($cell: Cheerio<AnyNode>, $: CheerioAPI): string[] => {
  const names = new Set<string>();
  $cell
    .find('a')
    .toArray()
    .forEach((el) => {
      const name = nullIfEmpty(textOrNull($(el)));
      if (name) names.add(name);
    });
  return [...names];
};

/**
 * Browse/search rows carry the source's own chapter tally in a "Статус (томов)" row —
 * `<b>89 глав</b>` or `<b>Нет глав</b>` for zero — since the row has no chapter table to count.
 * HENCHAN's list rows have no such block (single-page reader, no chapter concept), so this
 * returns null there rather than matching anything by accident.
 */
const parseListChaptersCount = ($row: Cheerio<AnyNode>, $: CheerioAPI): number | null => {
  let count: number | null = null;
  $row.find('div.manga_row3').each((_, el) => {
    const $section = $(el);
    if (!(textOrNull($section.find('div.item').first()) ?? '').includes('Статус')) return;
    const text = textOrNull($section.find('div.item2 b').last());
    if (!text) return;
    if (/нет\s*глав/i.test(text)) {
      count = 0;
      return;
    }
    const match = /\d+/.exec(text);
    if (match) count = Number.parseInt(match[0], 10);
  });
  return count;
};

const cutBeforeTrailingDiv = (html: string): string => {
  const idx = html.lastIndexOf('<div');
  return idx === -1 ? html : html.slice(0, idx);
};

/**
 * `"fullimg"` script marker precedes a bare JS array of quoted image paths:
 * `var pictures = "fullimg" ... ["001.jpg","002.jpg"];`. Ported from ChanParser.getPages —
 * extracts the array body (after the first `[`, before `;`, before the last `]`) and splits on
 * comma; each token can be single- or double-quoted.
 */
const extractFullImgPaths = (scriptText: string): string[] | null => {
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
};

/**
 * The only filter axis this DLE engine exposes is a tag cloud — no genre/status/rating sidebar.
 * A tag selection replaces the whole browse path with `/tags/<key1>+<key2>+-<excludedKey>`
 * (excluded keys `-`-prefixed, included ones listed first — ChanParser.buildUrl's ordering) plus
 * an `n=` sort param. HenChanParser only overrides the no-filter branch upstream and YaoiChanParser
 * doesn't override buildUrl at all, so this branch is shared unchanged across all three variants.
 */
const tagsPathSegment = (filters: FilterSelection[]): string | null => {
  const included: string[] = [];
  const excluded: string[] = [];
  for (const filter of filters) {
    if ('range' in filter || filter.groupId !== CHAN_FILTER_GROUP.TAG) continue;
    (filter.exclude ? excluded : included).push(filter.exclude ? `-${filter.key}` : filter.key);
  }
  if (included.length === 0 && excluded.length === 0) return null;
  return [...included, ...excluded].join('+');
};

/** Shared by every route-axis branch below — verified live that `n=` sorts `/tags/...`,
 *  `/type/...` and `/catalog/<status>` identically (same DLE listing template underneath). */
const chanSortParam = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.RATING:
    case SORT_ORDER.POPULARITY:
      return 'favdesc';
    case SORT_ORDER.ALPHABETICAL:
      return 'abcasc';
    case SORT_ORDER.CHAPTERS:
      return 'chdesc';
    default:
      return ''; // SortOrder.ADDED
  }
};

/** Field name behind `chanSortParam`'s `n=` value, split out so a direction override can be
 *  appended explicitly (see `supportsDirection` doc on ChanConfig). */
const chanSortField = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.RATING:
    case SORT_ORDER.POPULARITY:
      return 'fav';
    case SORT_ORDER.ALPHABETICAL:
      return 'abc';
    case SORT_ORDER.CHAPTERS:
      return 'ch';
    default:
      return 'date'; // SortOrder.ADDED
  }
};

/** Direction each dedicated browse page (`/mostfavorites`, `/catalog`, `/sortch`, `/manga/new`)
 *  is already sorted in — only the alphabetical listing is ascending, everything else is
 *  newest/most-first. Matches the values `chanSortParam` bakes in below. */
const chanDefaultDirection = (order: string | undefined): string =>
  order === SORT_ORDER.ALPHABETICAL ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC;

const findSingleSelection = (
  filters: FilterSelection[] | undefined,
  groupId: string,
): string | null => {
  const found = filters?.find(
    (f): f is Extract<FilterSelection, { key: string }> => 'key' in f && f.groupId === groupId,
  );
  return found?.key ?? null;
};

const buildListUrl = (
  cfg: ChanConfig,
  domain: string,
  offset: number,
  order: string | undefined,
  direction: string | undefined,
  query: string | undefined,
  filters: FilterSelection[] | undefined,
): string => {
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

  const tagsSegment = filters ? tagsPathSegment(filters) : null;
  if (tagsSegment !== null) {
    url.pathname = `/tags/${tagsSegment}`;
    url.searchParams.set('n', chanSortParam(order));
    return url.toString();
  }

  // "Тип" and "Статус" are exclusiveGroup siblings of tags (see ROUTE_EXCLUSIVE_GROUP) — the UI
  // only ever sends one of the three, but pick a fixed precedence defensively rather than mixing.
  const typeKey = findSingleSelection(filters, CHAN_FILTER_GROUP.TYPE);
  if (typeKey !== null) {
    url.pathname = `/type/${typeKey}`;
    url.searchParams.set('n', chanSortParam(order));
    return url.toString();
  }

  const statusKey = findSingleSelection(filters, CHAN_FILTER_GROUP.STATUS);
  if (statusKey !== null) {
    url.pathname = `/catalog/${statusKey}`;
    url.searchParams.set('n', chanSortParam(order));
    return url.toString();
  }

  // The site's sort menu points POPULARITY/RATING/ALPHABETICAL/CHAPTERS at their own dedicated
  // pre-sorted pages (/mostfavorites, /catalog, /sortch) — but verified live, item-for-item
  // across multiple offsets, that `/manga/new?n=<field><asc|desc>` returns exactly the same
  // listing for every one of them on MANGACHAN (RATING aliases POPULARITY's `fav` field — this
  // DLE engine has no separate rating axis, see RawTitle.likes doc). HENCHAN's own dedicated
  // pages (/mostviews, /mostfavorites, /manga/newest — different paths, different `sort=manga`
  // param) weren't reachable to verify the same way, but that source is already non-functional,
  // so it shares this route unverified for now rather than keeping a second code path alive.
  url.pathname = '/manga/new';
  const resolvedDirection =
    cfg.supportsDirection && direction ? direction : chanDefaultDirection(order);
  const dirSuffix = resolvedDirection === SORT_DIRECTION.ASC ? 'asc' : 'desc';
  url.searchParams.set('n', `${chanSortField(order)}${dirSuffix}`);
  return url.toString();
};

export const createChanParser = (cfg: ChanConfig, ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  const parseMangaRow = (
    $row: Cheerio<AnyNode>,
    $: CheerioAPI,
    baseUrl: string,
  ): RawTitle | null => {
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
        const key = parseHrefKey(attrOrNull($el, 'href'), text);
        return { title: toTagName(text), key, source: cfg.id };
      })
      .filter((t): t is RawTag => t !== null);
    // Confusingly named by the source's own markup — `div.tags` holds a truncated description
    // preview (ends "..."), not the genre tags (those are `div.genre`, mapped above).
    const description = textOrNull($row.find('div.tags').first());

    return {
      id: generateUid(cfg.id, relUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
      url: relUrl,
      publicUrl,
      rating: RATING_UNKNOWN,
      likes: parseLikesFromText($row.text()),
      contentRating: cfg.isNsfw ? CONTENT_RATING.ADULT : null,
      coverUrl,
      tags,
      releaseState: null,
      authors: author ? [author] : [],
      largeCoverUrl: null,
      description,
      chapters: null,
      chaptersCount: parseListChaptersCount($row, $),
      source: cfg.id,
    };
  };

  const fetchListPage = async (
    offset: number,
    order: string | undefined,
    direction: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawTitle[]> => {
    const url = buildListUrl(cfg, domain, offset, order, direction, query, filters);
    const doc = await ctx.http.getHtml(url);
    const root = doc.$('div.main_fon').find('#content').first();
    if (root.length === 0) {
      throw new ParseError(`Cannot find root: ${url}`, cfg.id);
    }
    return root
      .find('div.content_row')
      .toArray()
      .map((el) => parseMangaRow(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawTitle => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    const size = params.query ? SEARCH_NATIVE_SIZE : BROWSE_NATIVE_SIZE;
    return fetchOffsetNative(params, { size }, (offset) =>
      fetchListPage(offset, params.order, params.direction, params.query, params.filters),
    );
  };

  /**
   * Three independent route axes, each fetched from its own dedicated page rather than a shared
   * catalog/browse page — every one of these was verified live rather than assumed:
   *
   * - Tags: `/tags/` is a standalone "tag cloud" page (not the browse sidebar) — one request
   *   returns the full set (~90 on manga-chan.me) with no pagination, each `<a>` carrying a
   *   `title="Найдено новостей: N"` count. `span.news a` inside `#dle-content`.
   * - Тип ("Тип"): `/type/` lists every content-type value (Манга/Манхва/Маньхуа/Ранобэ/...) as
   *   `div.series_wrap` cards; the href IS the raw type name (`href="Манга"`, not a slug), used
   *   verbatim as the `/type/<name>` path segment.
   * - Статус ("Статус"): only shown in the `/catalog` page's sidebar (`#side div.only a`), not on
   *   `/tags/` or `/type/` — five routes (`/catalog/all_done`, `/end`, `/ongoing`, `/new_ch`,
   *   `/without_ch`) plus a `/catalog` "show everything" reset link that isn't a distinct status
   *   and is skipped (its href has no second path segment).
   *
   * Each fetch is independent and swallows its own failure (missing markup, a transient 502 —
   * this DLE engine occasionally 502s, same flakiness already documented for NUDEMOON) so one
   * broken axis doesn't blank out the other two.
   */
  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const safeFetchGroup = async (
    fetcher: () => Promise<RawFilterGroup | null>,
  ): Promise<RawFilterGroup | null> => {
    try {
      return await fetcher();
    } catch {
      return null;
    }
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const groups = await Promise.all([
      safeFetchGroup(fetchTagGroup),
      safeFetchGroup(fetchTypeGroup),
      safeFetchGroup(fetchStatusGroup),
    ]);
    return groups.filter((g): g is RawFilterGroup => g !== null);
  };

  const fetchTagGroup = async (): Promise<RawFilterGroup | null> => {
    const doc = await ctx.http.getHtml(`https://${domain}/tags/`);
    const options: RawFilterOption[] = doc
      .$('#dle-content span.news a')
      .toArray()
      .map((el): RawFilterOption | null => {
        const $a = doc.$(el);
        const text = textOrNull($a);
        if (!text) return null;
        return {
          key: parseHrefKey(attrOrNull($a, 'href'), text),
          title: toTagName(text),
          count: parseCountFromTitle(attrOrNull($a, 'title')),
        };
      })
      .filter((o): o is RawFilterOption => o !== null);
    if (options.length === 0) return null;
    return {
      id: CHAN_FILTER_GROUP.TAG,
      title: 'Теги',
      type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
      options,
      exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
    };
  };

  const fetchTypeGroup = async (): Promise<RawFilterGroup | null> => {
    const doc = await ctx.http.getHtml(`https://${domain}/type/`);
    // Each card is `<a href=X><div><h2><a href=X title=X>TEXT</a></h2></div></a>` — `<a>` wrapping
    // a `<div>` gets reconstructed by HTML5 tree-building (same quirk as li.sidetag elsewhere in
    // this file), so the first `<a>` in the subtree is an empty echo; the text lives on the last.
    const options: RawFilterOption[] = doc
      .$('#content div.series_wrap')
      .toArray()
      .map((el): RawFilterOption | null => {
        const text = textOrNull(doc.$(el).find('a').last());
        return text ? { key: text, title: text, count: null } : null;
      })
      .filter((o): o is RawFilterOption => o !== null);
    if (options.length === 0) return null;
    return {
      id: CHAN_FILTER_GROUP.TYPE,
      title: 'Тип',
      type: FILTER_TYPE.RADIO,
      options,
      exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
    };
  };

  const fetchStatusGroup = async (): Promise<RawFilterGroup | null> => {
    const doc = await ctx.http.getHtml(`https://${domain}/catalog`);
    const options: RawFilterOption[] = doc
      .$('div.main_fon #side div.only a')
      .toArray()
      .map((el): RawFilterOption | null => {
        const $a = doc.$(el);
        const text = textOrNull($a);
        const hrefAttr = attrOrNull($a, 'href');
        if (!text || !hrefAttr) return null;
        const segments = hrefAttr.split('/').filter(Boolean);
        // `/catalog` itself (no second segment) is the "show everything" reset link, not a status.
        if (segments.length < 2) return null;
        return { key: segments[segments.length - 1]!, title: text, count: null };
      })
      .filter((o): o is RawFilterOption => o !== null);
    if (options.length === 0) return null;
    return {
      id: CHAN_FILTER_GROUP.STATUS,
      title: 'Статус',
      type: FILTER_TYPE.RADIO,
      options,
      exclusiveGroup: ROUTE_EXCLUSIVE_GROUP,
    };
  };

  const parseDefaultChapters = ($root: Cheerio<AnyNode>, $: CheerioAPI): RawChapter[] => {
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
        volume: null,
        url: relUrl,
        scanlator: null,
        uploadDate: parseGroupleDate(textOrNull($tr.find('div.date').first())),
        branch: null,
        source: cfg.id,
      });
    });
    return chapters;
  };

  const parseYaoichanChapters = ($root: Cheerio<AnyNode>, $: CheerioAPI): RawChapter[] => {
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
        volume: null,
        url: relUrl,
        scanlator: null,
        uploadDate: 0,
        branch: null,
        source: cfg.id,
      });
    });
    return chapters;
  };

  const henchanChapters = (mangaUrl: string): RawChapter[] => {
    const readLink = mangaUrl.split('manga').join('online');
    return [
      {
        id: generateUid(cfg.id, readLink),
        title: null,
        number: null,
        volume: null,
        url: readLink,
        scanlator: null,
        uploadDate: 0,
        branch: null,
        source: cfg.id,
      },
    ];
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const absoluteUrl = new URL(mangaUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const root = doc.$('#dle-content').first();
    if (root.length === 0) {
      throw new ParseError(`Cannot find #dle-content: ${absoluteUrl}`, cfg.id);
    }

    const descHtml = root.find('#description').first().html();
    const description = descHtml ? cutBeforeTrailingDiv(descHtml) : null;
    const $cover = root.find('#cover').first();
    let coverUrl = attrOrNull($cover, 'src') ? absUrl($cover, 'src', doc.baseUrl) : null;
    const { title, altTitle } = parseTitle(textOrNull(root.find('h1').first()) ?? '');
    const type = parseChanType(textOrNull(findInfoCell(root, doc.$, 'Тип')));
    const authors = parseChanCredits(findInfoCell(root, doc.$, 'Автор'), doc.$);
    const translators = parseChanCredits(findInfoCell(root, doc.$, 'Переводчики'), doc.$);
    const releaseState = parseChanReleaseState(
      textOrNull(findInfoCell(root, doc.$, 'Статус (Томов)')),
    );
    const translationState = parseChanState(textOrNull(findInfoCell(root, doc.$, 'Загружено')));
    const otherTitles = parseChanAltTitles(
      textOrNull(findInfoCell(root, doc.$, 'Другие названия')),
    );
    const altTitles = [...new Set([...(altTitle ? [altTitle] : []), ...otherTitles])];
    const tags: RawTag[] = root
      .find('div.sidetags li.sidetag')
      .toArray()
      .map((el) => {
        const $a = doc.$(el).children().last();
        const text = textOrNull($a);
        if (!text) return null;
        const key = parseHrefKey(attrOrNull($a, 'href'), text);
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
      altTitles,
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      likes: parseLikesFromText(root.text()),
      contentRating: cfg.isNsfw ? CONTENT_RATING.ADULT : null,
      coverUrl,
      tags,
      type,
      releaseState,
      translationState,
      authors,
      translators,
      largeCoverUrl: coverUrl,
      description,
      chapters,
      source: cfg.id,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
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
  };

  return {
    id: cfg.id,
    info: {
      id: cfg.id,
      title: catalogEntryFor(cfg.id).title,
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: cfg.isNsfw ? SOURCE_CONTENT_TYPE.HENTAI : SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      requiresVpn: catalogEntryFor(cfg.id).requiresVpn,
      sortOrders: cfg.sortOrders,
      supportsDirection: cfg.supportsDirection,
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: true,
      isSearchWithFiltersSupported: false,
    },
    getList,
    getDetails,
    getPages,
    getFilters,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

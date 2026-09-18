import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_RESTRICTION,
  TITLE_STATE,
  TITLE_TYPE,
  RANGE_FORMAT,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type TitleState,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchOffsetNative } from '../../core/paging';
import { getYearRangePresets } from '../../core/filters/range-presets';
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
import { concatUrl, toAbsoluteUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, ownText, selectFirstOrThrow } from '../../core/html/selectors';
import { parseGroupleDate } from '../../core/text/dates';
import { parseFloatOrNull, parseIntOrNull } from '../../core/text/numbers';
import { toTitleCase, nullIfEmpty, findGroupValue } from '../../core/text/strings';
import { ParseError, SourceAuthRequiredError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';
import { catalogEntryFor, SOURCE_ID } from '../catalog';
import { authenticateGrouple, authenticateAllHentai } from './auth';
import type { GroupleConfig } from './config';
import { GROUPLE_ELEMENT_TYPE, GROUPLE_FILTER_GROUP, GROUPLE_TRANSLATION_STATUS } from './models';
import type {
  CatalogItemJson,
  CatalogSearchResponseJson,
  GroupleFilterGroup,
  GroupleTranslationStatus,
} from './models';

const PAGE_SIZE = 50;
const NSFW_ALERT = 'сексуальные сцены';
const MIN_IMAGE_SIZE = 1024;
const COPYRIGHT_ALERT = 'Запрещена публикация произведения';
const NO_CHAPTERS = 'В этой манге еще нет ни одной главы';

const HREF_CHAPTER_NUMBER_REGEX = /\/vol\d+\/([0-9]+(?:[.,]\d+)?)/i;
const TITLE_CHAPTER_NUMBER_REGEX = /([0-9]+(?:[.,]\d+)?)\s*$/;
const HREF_VOLUME_REGEX = /\/vol(\d+)\//i;
const USER_HASH_REGEX = /window\.user_hash\s*=\s*'([^']+)'/;

/**
 * `/search/advanced` embeds its whole filter vocabulary as flat `window.__FILTERS.<name> = {...};`
 * assignments (id/code → Russian label), one per axis — verified live against 2.mintmanga.one.
 * Each object is plain double-quoted JSON with no nesting, so a non-greedy match up to the first
 * `}` is enough; `years` is the one exception (a bare `{ min, max }` JS literal, not JSON), parsed
 * separately below.
 */
const GROUPLE_FILTER_MAP_REGEX = /window\.__FILTERS\.(\w+)\s*=\s*(\{[\s\S]*?\});/g;
const GROUPLE_FILTER_YEARS_REGEX =
  /window\.__FILTERS\.years\s*=\s*\{\s*min:\s*(\d+),\s*max:\s*(\d+)\s*\};/;
const DEFAULT_YEARS_RANGE = { min: 1900, max: 2100 };

const YEAR_RANGE_CUTOFF = 2000;

/** Element ids (genre/category/age rating/misc) all round-trip through the same
 *  includeElementIds/excludeElementIds params on the search API — see applySelectionParams. */
const ELEMENT_FILTER_GROUPS = new Set<string>([
  GROUPLE_FILTER_GROUP.GENRE,
  GROUPLE_FILTER_GROUP.CATEGORY,
  GROUPLE_FILTER_GROUP.AGE_RATING,
  GROUPLE_FILTER_GROUP.MISC,
]);

const getSearchSortType = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.LIKES:
      return 'USER_RATING';
    case SORT_ORDER.ALPHABETICAL:
      return 'NAME';
    case SORT_ORDER.RELEASED:
      return 'YEAR';
    case SORT_ORDER.POPULARITY:
      return 'POPULARITY';
    case SORT_ORDER.RATING:
      return 'RATING';
    case SORT_ORDER.ADDED:
      return 'DATE_CREATE';
    default:
      return 'DATE_UPDATE';
  }
};

/** Pulls every `window.__FILTERS.<name> = {...};` map out of the advanced-search page, keyed by
 *  its axis name (`genre`, `category`, `limitation`, `another`, `productionStatus`,
 *  `translationStatus`, `searchFilters`) — `sortType` and `years` are handled separately. */
const parseGroupleFilterMaps = (html: string): Record<string, Record<string, string>> => {
  const maps: Record<string, Record<string, string>> = {};
  for (const match of html.matchAll(GROUPLE_FILTER_MAP_REGEX)) {
    const name = match[1]!;
    if (name === 'sortType' || name === 'years') continue;
    try {
      maps[name] = JSON.parse(match[2]!) as Record<string, string>;
    } catch {
      // skip malformed block rather than failing the whole filter fetch
    }
  }
  return maps;
};

const optionsFromMap = (map: Record<string, string> | undefined): RawFilterOption[] =>
  Object.entries(map ?? {}).map(([key, title]) => ({ key, title, count: null }));

/**
 * AllHentai's `/search/advanced` never got migrated to the `window.__FILTERS` JSON template the
 * rest of the network uses (verified live: authenticated fetch returns 200 with zero
 * `window.__FILTERS.*` assignments) — it's still the older plain HTML form, one `<div
 * class="form-group row">` per axis, options as `<li class="property">` checkboxes toggled by
 * `rm_h.search.clickOption(this, 'el_855')`. That toggle (seen in the site's own bundled JS)
 * cycles each hidden input's `name`/`value` through unset → `name=<id>, value="in"` → `value=
 * "ex"` → unset again, so the id namespace and in/ex semantics are identical to the JSON
 * template's includeElementIds/excludeElementIds — only the scrape shape differs. Confirmed
 * live against `/api/catalog/search` that includeElementIds/includeSearchFilter/
 * includeProductionStatuses/includeTranslationStatuses all accept these same keys unchanged.
 * "Пародии"/"Тэги"/"Персона" are deliberately not scraped here — the site itself only offers
 * them as an ajax type-ahead with no exhaustive option list (`elementsByType` returns `null`
 * until a query is typed), which doesn't fit any FILTER_TYPE this app supports.
 */
const LEGACY_FORM_FILTER_GROUPS: Partial<
  Record<string, { id: GroupleFilterGroup; prefix: string; upperKey?: boolean }>
> = {
  Жанры: { id: GROUPLE_FILTER_GROUP.GENRE, prefix: 'el_' },
  Категории: { id: GROUPLE_FILTER_GROUP.CATEGORY, prefix: 'el_' },
  Фильтры: { id: GROUPLE_FILTER_GROUP.SEARCH_FILTER, prefix: 's_', upperKey: true },
  'Статус выхода': { id: GROUPLE_FILTER_GROUP.PRODUCTION_STATUS, prefix: 'prod_' },
  'Статус перевода': { id: GROUPLE_FILTER_GROUP.TRANSLATION_STATUS, prefix: 'trans_' },
};

const parseLegacyFormFilterGroup = (
  $: CheerioAPI,
  $group: Cheerio<AnyNode>,
  labelText: string,
): RawFilterGroup | null => {
  const spec = LEGACY_FORM_FILTER_GROUPS[labelText];
  if (!spec) return null;
  const options: RawFilterOption[] = [];
  $group.find('li.property').each((_, li) => {
    const $li = $(li);
    const name = attrOrNull($li.find('input.hide').first(), 'name');
    const title = attrOrNull($li.find('label span.js-link').first(), 'title');
    if (!name || !title || !name.startsWith(spec.prefix)) return;
    const rawKey = name.slice(spec.prefix.length);
    options.push({ key: spec.upperKey ? rawKey.toUpperCase() : rawKey, title, count: null });
  });
  if (options.length === 0) return null;
  return {
    id: spec.id,
    title: labelText,
    type:
      spec.id === GROUPLE_FILTER_GROUP.GENRE
        ? FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE
        : FILTER_TYPE.CHECKBOX_EXCLUDE,
    options,
  };
};

const parseLegacyFormYearGroup = ($group: Cheerio<AnyNode>): RawFilterGroup | null => {
  const slider = $group.find('input.range-input[name=years]').first();
  const min = parseIntOrNull(attrOrNull(slider, 'data-slider-min'));
  const max = parseIntOrNull(attrOrNull(slider, 'data-slider-max'));
  if (min === null || max === null) return null;
  return {
    id: GROUPLE_FILTER_GROUP.YEAR,
    title: 'Год выпуска',
    type: FILTER_TYPE.RANGE,
    options: [],
    settings: {
      range: { min, max, format: RANGE_FORMAT.YEAR },
      presets: getYearRangePresets(min, max, YEAR_RANGE_CUTOFF),
    },
  };
};

const LEGACY_FORM_GROUP_ORDER: GroupleFilterGroup[] = [
  GROUPLE_FILTER_GROUP.GENRE,
  GROUPLE_FILTER_GROUP.CATEGORY,
  GROUPLE_FILTER_GROUP.PRODUCTION_STATUS,
  GROUPLE_FILTER_GROUP.TRANSLATION_STATUS,
  GROUPLE_FILTER_GROUP.YEAR,
  GROUPLE_FILTER_GROUP.SEARCH_FILTER,
];

const parseLegacyFormFilters = ($: CheerioAPI): RawFilterGroup[] => {
  const byId = new Map<string, RawFilterGroup>();
  $('#advanced > .form-group.row').each((_, el) => {
    const $group = $(el);
    const $label = $group.find('> .col-sm-2.col-form-label').first();
    if ($label.length === 0) return;
    const labelText = ($label.find('> a').first().text() || $label.text()).trim();
    const group =
      labelText === 'Год выпуска'
        ? parseLegacyFormYearGroup($group)
        : parseLegacyFormFilterGroup($, $group, labelText);
    if (group) byId.set(group.id, group);
  });
  return LEGACY_FORM_GROUP_ORDER.map((id) => byId.get(id)).filter(
    (g): g is RawFilterGroup => g !== undefined,
  );
};

const extractJsonAfter = (data: string, pos: number): string | null => {
  const tail = data.slice(pos);
  const openIdx = tail.indexOf('(');
  if (openIdx === -1) return null;
  const afterParen = tail.slice(openIdx + 1);
  const uptoNewline = (afterParen.split('\n')[0] ?? '').trim();
  const lastParen = uptoNewline.lastIndexOf(')');
  const json = lastParen === -1 ? uptoNewline : uptoNewline.slice(0, lastParen);
  return json.length === 0 ? null : json;
};

/**
 * Extracts the JS array literal starting at the first `[` at or after `fromIndex`, tracking
 * bracket depth and (single/double-quoted, backslash-escaped) string state so brackets inside
 * URLs or strings don't get counted. Returns null if the array is never closed.
 */
const extractBalancedArray = (text: string, fromIndex: number): string | null => {
  let depth = 0;
  let quote: '"' | "'" | null = null;
  let start = -1;
  for (let i = fromIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '[') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === ']') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
};

/** Converts single-quoted JS string literals to double-quoted JSON ones; leaves the rest as-is. */
const jsArrayLiteralToJson = (text: string): string => {
  return text.replace(/'((?:[^'\\]|\\.)*)'/g, (_match, inner: string) => {
    const withoutEscapedQuotes = inner.replace(/\\'/g, "'").replace(/"/g, '\\"');
    return `"${withoutEscapedQuotes}"`;
  });
};

/**
 * Grouple's chapter reader embeds page lists as a JS call in a <script> tag, in one of three
 * historical formats (rm_h.readerDoInit / rm_h.readerInit / a bare .readerInit). Each maps a
 * chapter to `primaryServer|otherServer1|otherServer2|...|relativePath` — the actual image
 * host is resolved later by probing candidates (see resolvePageUrl below), because the fastest
 * responding mirror changes over time and isn't knowable up front.
 */
const parsePagesV1 = (data: string, pos: number, sourceId: string): RawPage[] | null => {
  const json = extractJsonAfter(data, pos);
  if (!json) return null;
  let ja: unknown[];
  try {
    ja = JSON.parse(jsArrayLiteralToJson(`[${json}]`)) as unknown[];
  } catch {
    return null;
  }
  const pages = ja[1] as unknown[][] | undefined;
  const servers = ja[3] as { path: string }[] | undefined;
  if (!pages || !servers) return null;
  const serversStr = servers.map((s) => s.path).join('|');
  return pages.map((page) => {
    const primaryServer = String(page[0]);
    const url = String(page[2]);
    const combined = `${primaryServer}|${serversStr}|${url}`;
    const fullSrc = combined.includes('one-way.work')
      ? (combined.split('?')[0] ?? combined)
      : combined;
    return { id: generateUid(sourceId, url), url: fullSrc, preview: null, source: sourceId };
  });
};

const parsePagesV2 = (data: string, pos: number, sourceId: string): RawPage[] | null => {
  const json = extractJsonAfter(data, pos);
  if (!json) return null;
  let ja: unknown[];
  try {
    ja = JSON.parse(jsArrayLiteralToJson(`[${json}]`)) as unknown[];
  } catch {
    return null;
  }
  const pages = ja[0] as unknown[][] | undefined;
  const servers = ja[2] as { path: string }[] | undefined;
  if (!pages || !servers) return null;
  const serversStr = servers.map((s) => s.path).join('|');
  return pages.map((page) => {
    const primaryServer = String(page[0]);
    const url = String(page[2]);
    const combined = `${primaryServer}|${serversStr}|${url}`;
    const fullSrc = combined.includes('one-way.work')
      ? (combined.split('?')[0] ?? combined)
      : combined;
    return { id: generateUid(sourceId, url), url: fullSrc, preview: null, source: sourceId };
  });
};

/**
 * The live call shape is `rm_h.readerInit(chapterInfo, [[server, '', path, w, h, ''], ...],
 * true, [{"path": ...}, ...], false)` — a bare pages array followed by extra arguments this
 * parser doesn't need (a boolean flag, a servers list already covered by `path`, another
 * flag). Pulling out just the balanced `[...]` right after the first argument, instead of
 * assuming a fixed number of trailing arguments, survives that tail changing shape again.
 */
const parsePagesV3 = (data: string, pos: number, domain: string, sourceId: string): RawPage[] => {
  const tail = data.slice(pos);
  const openParen = tail.indexOf('(');
  if (openParen === -1) {
    throw new ParseError('Invalid reader response: no readerInit( call found', sourceId);
  }
  const firstArrayStart = tail.indexOf('[', openParen);
  if (firstArrayStart === -1) {
    throw new ParseError('Invalid reader response: no pages array after readerInit(', sourceId);
  }
  const arrayLiteral = extractBalancedArray(tail, firstArrayStart);
  if (!arrayLiteral) {
    throw new ParseError('Invalid reader response: unbalanced pages array literal', sourceId);
  }

  let arr: unknown[][];
  try {
    arr = JSON.parse(jsArrayLiteralToJson(arrayLiteral)) as unknown[][];
  } catch {
    throw new ParseError(
      'Invalid reader response: pages array literal is not valid JSON',
      sourceId,
    );
  }
  return arr.map((entry) => {
    const server = String(entry[0] ?? '') || `https://${domain}`;
    const url = String(entry[2]);
    const fullUrl = concatUrl(server, url);
    const finalUrl = fullUrl.includes('one-way.work')
      ? (fullUrl.split('?')[0] ?? fullUrl)
      : fullUrl;
    return { id: generateUid(sourceId, url), url: finalUrl, preview: null, source: sourceId };
  });
};

export const createGroupleParser = (cfg: GroupleConfig, ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let cachedPagesServer: string | null = null;

  ctx.http.use(async (req, next) => {
    let pathname: string;
    try {
      pathname = new URL(req.url).pathname;
    } catch {
      pathname = '';
    }
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
      return next({
        ...req,
        headers: { ...req.headers, Accept: 'image/webp,image/png;q=0.9,image/jpeg,*/*;q=0.8' },
      });
    }

    const res = await next(req);

    const lastSegment = pathname.split('/').filter(Boolean).pop();
    if (lastSegment === 'login') {
      throw new SourceAuthRequiredError(`Login required: ${req.url}`, cfg.id);
    }
    if (res.status === 404) {
      const cookies = await ctx.jar.getCookies(`https://${domain}/`);
      const hasAuthCookie = cookies.some(
        (c) => c.key === 'gwt' || (cfg.extraAuthCookies ?? []).includes(c.key),
      );
      if (!hasAuthCookie) {
        throw new SourceAuthRequiredError(`Login required (soft 404): ${req.url}`, cfg.id);
      }
      // The site 404s some member-only pages for guests instead of a real 404 — with a valid
      // session this is a false alarm, so let the caller treat it as a normal response.
      res.status = 200;
    }
    return res;
  });

  const parseTagFromLink = ($el: Cheerio<AnyNode>): RawTag | null => {
    const title = textOrNull($el)?.replace('#', '').trim();
    if (!title) return null;
    const href = attrOrNull($el, 'href') ?? '';
    return {
      title: toTitleCase(title),
      key: href.split('/').filter(Boolean).pop() ?? title,
      source: cfg.id,
    };
  };

  const mapCatalogState = (status: GroupleTranslationStatus): TitleState | null => {
    switch (status) {
      case GROUPLE_TRANSLATION_STATUS.FINISHED:
        return TITLE_STATE.FINISHED;
      case GROUPLE_TRANSLATION_STATUS.PROGRESS:
        return TITLE_STATE.ONGOING;
      case GROUPLE_TRANSLATION_STATUS.POSTPONED:
        return TITLE_STATE.PAUSED;
      case GROUPLE_TRANSLATION_STATUS.NONE:
        return null;
    }
  };

  /** The details page's `.cr-info-details-item__status` widget (`data-production-status` for
   *  "Выпуск"/original release, `data-translation-status` for "Перевод"/this source's own
   *  translation) — a different code vocabulary than the catalog JSON's `translationStatus`
   *  above (PLANNED/PROGRESS/FINISHED/ABANDONED, confirmed live for PROGRESS on both attributes).
   *  Unrecognized codes fall back to null rather than a guess, since this is the site's own
   *  external vocabulary, not one this codebase owns. */
  const mapInfoStatus = (code: string | null): TitleState | null => {
    switch (code) {
      case 'PROGRESS':
        return TITLE_STATE.ONGOING;
      case 'FINISHED':
        return TITLE_STATE.FINISHED;
      case 'PLANNED':
        return TITLE_STATE.UPCOMING;
      case 'ABANDONED':
        return TITLE_STATE.ABANDONED;
      case 'POSTPONED':
        return TITLE_STATE.PAUSED;
      default:
        return null;
    }
  };

  /** Catalog "category" — mirrors the site's own .catalog-kinds filter vocabulary. Takes the
   *  category name directly so it works both off the JSON catalog item and off the details page's
   *  own category badge (`.cr-hero-short-details__item a[href*='/list/category/']`). */
  const mangaTypeByCategory = (name: string | null | undefined): RawTitleType | null => {
    switch (name) {
      case 'Манга':
        return TITLE_TYPE.MANGA;
      case 'Манхва':
        return TITLE_TYPE.MANHWA;
      case 'Манхуа':
      case 'Маньхуа':
        return TITLE_TYPE.MANHUA;
      case 'Комикс':
        return TITLE_TYPE.COMICS;
      case undefined:
      case null:
        return null;
      default:
        return TITLE_TYPE.OTHER;
    }
  };

  /** Catalog "limitation" element — the site's own MPAA-style age-rating badge (PG/PG-13/R/NC-17),
   *  attached per title rather than per source. Falls through to cfg.isNsfw when a title carries
   *  no badge at all, same as the un-tagged default used before this was per-title. */
  const contentRatingByLimitation = (name: string | undefined): RawContentRating | null => {
    switch (name) {
      case 'PG':
      case 'PG-13':
        return CONTENT_RATING.SAFE;
      case 'R':
        return CONTENT_RATING.SUGGESTIVE;
      case 'NC-17':
        return CONTENT_RATING.ADULT;
      default:
        return null;
    }
  };

  const mapCatalogItem = (item: CatalogItemJson): RawTitle => {
    const relUrl = `/${item.elementId.linkName}`;
    const tags: RawTag[] = (item.elements ?? [])
      .filter(
        (el) =>
          el.typeName === GROUPLE_ELEMENT_TYPE.GENRE || el.typeName === GROUPLE_ELEMENT_TYPE.TAG,
      )
      .map((el) => ({ title: toTitleCase(el.name), key: String(el.id), source: cfg.id }));
    const limitation = item.elements?.find(
      (el) => el.typeName === GROUPLE_ELEMENT_TYPE.LIMITATION,
    )?.name;
    const year = item.elements?.find((el) => el.typeName === GROUPLE_ELEMENT_TYPE.YEAR)?.name;

    return {
      id: generateUid(cfg.id, relUrl),
      title: item.name,
      altTitles: [],
      url: relUrl,
      publicUrl: `https://${domain}${relUrl}`,
      rating: item.rating && item.rating.voteCount > 0 ? item.rating.rate / 10 : RATING_UNKNOWN,
      contentRating:
        contentRatingByLimitation(limitation) ?? (cfg.isNsfw ? CONTENT_RATING.ADULT : null),
      coverUrl: item.picUrl,
      tags,
      releaseState: mapCatalogState(item.translationStatus),
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: cfg.id,
      type: mangaTypeByCategory(item.category?.name),
      chaptersCount: item.chaptersCount ?? null,
      year: year ? (parseIntOrNull(year) ?? null) : null,
    };
  };

  /**
   * `includeElementIds`/`excludeElementIds` cover genre, category, age rating ("limitation") and
   * misc ("another") alike — the site's own advanced-search UI splits them into separate sections,
   * but all four funnel into the same id space and query params (verified live: a captured request
   * with one selection checked in each of those four sections produced exactly 4 include + 4
   * exclude ids, matching ELEMENT_FILTER_GROUPS one-for-one). `search_filter` follows the same
   * include/exclude pair — its own tooltip (`.catalog-filter-checkbox`) shows both a
   * `data-type="include"` and a `data-type="exclude"` indicator per option, same as every other
   * *_EXCLUDE group here.
   */
  const applySelectionParams = (url: URL, filters: FilterSelection[] | undefined): void => {
    for (const filter of filters ?? []) {
      if ('range' in filter) continue; // years is handled separately below, by its own bounds
      if (ELEMENT_FILTER_GROUPS.has(filter.groupId)) {
        url.searchParams.append(
          filter.exclude ? 'excludeElementIds' : 'includeElementIds',
          filter.key,
        );
      } else if (filter.groupId === GROUPLE_FILTER_GROUP.PRODUCTION_STATUS) {
        url.searchParams.append(
          filter.exclude ? 'excludeProductionStatuses' : 'includeProductionStatuses',
          filter.key,
        );
      } else if (filter.groupId === GROUPLE_FILTER_GROUP.TRANSLATION_STATUS) {
        url.searchParams.append(
          filter.exclude ? 'excludeTranslationStatuses' : 'includeTranslationStatuses',
          filter.key,
        );
      } else if (filter.groupId === GROUPLE_FILTER_GROUP.SEARCH_FILTER) {
        url.searchParams.append(
          filter.exclude ? 'excludeSearchFilter' : 'includeSearchFilter',
          filter.key,
        );
      }
    }
  };

  const yearsRangeParam = (filters: FilterSelection[] | undefined): string => {
    const yearFilter = filters?.find(
      (f): f is Extract<FilterSelection, { range: unknown }> =>
        'range' in f && f.groupId === GROUPLE_FILTER_GROUP.YEAR,
    );
    const min = yearFilter?.range.min ?? DEFAULT_YEARS_RANGE.min;
    const max = yearFilter?.range.max ?? DEFAULT_YEARS_RANGE.max;
    return `${min},${max}`;
  };

  /**
   * Also used for plain catalog browsing (empty query). The old page-driven `/list` endpoint has
   * fallen behind the site's own live index, and the HTML `/search/advancedResults` endpoint it
   * was replaced with has since gone dark on several Grouple mirrors too (404 behind ddos-guard).
   * `/api/catalog/search` is the JSON API the site's own current frontend calls — live everywhere
   * `/search/advancedResults` used to be, plus mirrors where that's now dead — so it's the browse
   * endpoint as well as the search one.
   */
  const searchPage = async (
    query: string,
    nativeOffset: number,
    order: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawTitle[]> => {
    const url = new URL(`https://${domain}/api/catalog/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('offset', String(nativeOffset));
    url.searchParams.set('years', yearsRangeParam(filters));
    url.searchParams.set('sortType', getSearchSortType(order));
    applySelectionParams(url, filters);
    const response = await ctx.http.getJson<CatalogSearchResponseJson>(url.toString());
    return response.list.map(mapCatalogItem);
  };

  const parseChapterNumber = (
    href: string,
    dataNum: string | undefined,
    titleText: string,
  ): number => {
    const hrefMatch = HREF_CHAPTER_NUMBER_REGEX.exec(href);
    const hrefValue = hrefMatch ? parseFloatOrNull(hrefMatch[1]!.replace(',', '.')) : null;
    if (hrefValue !== null) return hrefValue;

    const cleanedTitle = titleText.replace(/новое/gi, '').trim();
    const titleMatch = TITLE_CHAPTER_NUMBER_REGEX.exec(cleanedTitle);
    const titleValue = titleMatch ? parseFloatOrNull(titleMatch[1]!.replace(',', '.')) : null;
    if (titleValue !== null) return titleValue;

    if (dataNum) {
      const raw = dataNum.replace(',', '.');
      const value = parseFloatOrNull(raw);
      if (value !== null) {
        return dataNum.includes('.') || dataNum.includes(',') ? value : value / 10;
      }
    }
    return 0;
  };

  const parseChapterVolume = (href: string, dataVol: string | undefined): number => {
    const fromAttr = parseIntOrNull(dataVol ?? null);
    if (fromAttr !== null) return fromAttr;
    const match = HREF_VOLUME_REGEX.exec(href);
    return match ? (parseIntOrNull(match[1]!) ?? 0) : 0;
  };

  const parseChapterUploadDate = ($td: Cheerio<AnyNode>): number => {
    if ($td.length === 0) return 0;
    const dataDate = attrOrNull($td, 'data-date') ?? textOrNull($td);
    const primary = parseGroupleDate(dataDate);
    if (primary !== 0) return primary;
    return parseGroupleDate(attrOrNull($td, 'data-date-raw'));
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    return fetchOffsetNative(params, { size: PAGE_SIZE }, (offset) =>
      searchPage(params.query ?? '', offset, params.order, params.filters),
    );
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const doc = await ctx.http.getHtml(`https://${domain}/search/advanced`);
    const html = doc.$.html();
    const maps = parseGroupleFilterMaps(html);
    const yearsMatch = GROUPLE_FILTER_YEARS_REGEX.exec(html);

    if (Object.keys(maps).length === 0 && !yearsMatch) {
      return parseLegacyFormFilters(doc.$);
    }

    const groups: RawFilterGroup[] = [];
    const genres = optionsFromMap(maps.genre);
    if (genres.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres,
      });
    }
    const categories = optionsFromMap(maps.category);
    if (categories.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.CATEGORY,
        title: 'Категории',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: categories,
      });
    }
    const ageRatings = optionsFromMap(maps.limitation);
    if (ageRatings.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.AGE_RATING,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: ageRatings,
      });
    }
    const productionStatuses = optionsFromMap(maps.productionStatus);
    if (productionStatuses.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.PRODUCTION_STATUS,
        title: 'Статус выхода',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: productionStatuses,
      });
    }
    const translationStatuses = optionsFromMap(maps.translationStatus);
    if (translationStatuses.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.TRANSLATION_STATUS,
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: translationStatuses,
      });
    }
    if (yearsMatch) {
      const yearMin = Number.parseInt(yearsMatch[1]!, 10);
      const yearMax = Number.parseInt(yearsMatch[2]!, 10);
      groups.push({
        id: GROUPLE_FILTER_GROUP.YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: yearMin, max: yearMax, format: RANGE_FORMAT.YEAR },
          presets: getYearRangePresets(yearMin, yearMax, YEAR_RANGE_CUTOFF),
        },
      });
    }
    const searchFilters = optionsFromMap(maps.searchFilters);
    if (searchFilters.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.SEARCH_FILTER,
        title: 'Фильтры',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: searchFilters,
      });
    }
    const misc = optionsFromMap(maps.another);
    if (misc.length > 0) {
      groups.push({
        id: GROUPLE_FILTER_GROUP.MISC,
        title: 'Прочее',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: misc,
      });
    }
    return groups;
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const absoluteUrl = new URL(mangaUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const mangaBox = selectFirstOrThrow(doc.$.root(), '#mangaBox', cfg.id, 'getDetails root');
    const root = mangaBox.find('div.leftContent').first().length
      ? mangaBox.find('div.leftContent').first()
      : mangaBox;

    const posterSlide = root.find('div.cr-hero-poster .swiper-slide').first();
    const coverImg = posterSlide.length
      ? posterSlide.find('img').first()
      : root.find('div.cr-hero-poster img.cr-hero-poster__img').first().length
        ? root.find('div.cr-hero-poster img.cr-hero-poster__img').first()
        : root.find('div.subject-cover img').first();

    // The canonical tag is sometimes emitted host-relative (`href="/slug"`) rather than absolute,
    // which would otherwise leak straight into publicUrl and get resolved against the *app's own*
    // origin by the browser instead of the source's.
    const canonicalHref = doc.$('link[rel=canonical]').attr('href');
    const finalUrl = canonicalHref ? toAbsoluteUrl(canonicalHref, domain) : absoluteUrl;
    const chaptersList = doc.$('#chapters-list');
    let isRestricted = false;
    if (chaptersList.length === 0 && !root.text().includes(NO_CHAPTERS)) {
      if (root.text().includes(COPYRIGHT_ALERT)) {
        isRestricted = true;
      } else {
        throw new ParseError(`No chapters found: ${absoluteUrl}`, cfg.id);
      }
    }

    const scriptsText = doc
      .$('script')
      .toArray()
      .map((el) => doc.$(el).html() ?? '')
      .join('\n');
    const userHash = findGroupValue(scriptsText, USER_HASH_REGEX);

    const hasNsfwAlert = root
      .find('.alert-warning')
      .toArray()
      .some((el) => ownText(doc.$(el)).includes(NSFW_ALERT));

    // `data-rating-status="none"` is the site's own marker for "0 votes" — its value text is a
    // literal "0", which would otherwise be indistinguishable from a genuine bottom score.
    const ratingValueEl = mangaBox
      .find('.cr-hero-rating__item--main .cr-hero-rating__value')
      .first();
    const ratingValue = parseFloatOrNull(textOrNull(ratingValueEl));
    const rating =
      ratingValue !== null && attrOrNull(ratingValueEl, 'data-rating-status') !== 'none'
        ? ratingValue / 10
        : RATING_UNKNOWN;

    const tagSelector = [
      'div.subject-meta a.element-link',
      '.subject-meta a.element-link',
      '.elem_genre a',
      '.subject-tags a',
      '.cr-tags a.cr-tags__item',
      "a.element-link[href*='/genre/']",
      "a[href*='/list/genre/']",
      "a[href*='/genre/']",
      "a[href*='/list/tag/']",
      "a[href*='/tag/']",
    ].join(', ');
    const tags = new Map<string, RawTag>();
    for (const el of [
      ...root.find(tagSelector).toArray(),
      ...doc.$('.cr-tags a.cr-tags__item').toArray(),
    ]) {
      const tag = parseTagFromLink(doc.$(el));
      if (tag) tags.set(tag.key, tag);
    }

    const chapterRows = chaptersList.find('tr.item-row');
    const chapterNodes = chapterRows.length > 0 ? chapterRows : chaptersList.find('a.chapter-link');
    const chapters: RawChapter[] = [];
    chapterNodes.toArray().forEach((rowEl) => {
      const $row = doc.$(rowEl);
      const isRow = rowEl.tagName?.toLowerCase() === 'tr';
      const $tr = isRow ? $row : $row.closest('tr');
      const $a = isRow ? $row.find('a.chapter-link').first() : $row;
      if ($a.length === 0) return;

      const hrefRaw = attrOrNull($a, 'href');
      if (!hrefRaw) return;
      const href = new URL(hrefRaw, doc.baseUrl).pathname + new URL(hrefRaw, doc.baseUrl).search;
      const chapterTitleText = ownText($a) || textOrNull($a) || '';
      const chapterTitle = nullIfEmpty(chapterTitleText.trim());
      const number = parseChapterNumber(href, $tr.attr('data-num'), chapterTitleText);
      const volume = parseChapterVolume(href, $tr.attr('data-vol'));
      const uploadDate = parseChapterUploadDate($tr.find('td.date').first());

      let scanlator: string | null = null;
      const translatorAttr = $a.attr('title');
      if (translatorAttr && translatorAttr.trim()) {
        scanlator = translatorAttr.replace('(Переводчик),', '&').replace(/ \(Переводчик\)$/, '');
      }

      const finalHref = userHash ? `${href}${href.includes('?') ? '&' : '?'}d=${userHash}` : href;
      chapters.push({
        id: generateUid(cfg.id, finalHref),
        title: chapterTitle,
        number,
        volume,
        url: finalHref,
        scanlator,
        uploadDate,
        branch: scanlator,
        source: cfg.id,
      });
    });
    chapters.reverse();

    // Сайты сети переехали на schema.org-разметку (`itemprop`), поэтому она проверяется первой,
    // а прежние селекторы остаются запасными: домены обновляются не одновременно. Последним
    // идёт <title> страницы — он содержит SEO-хвост вида «Манга X (Y) Автор Новые главы - Сайт»
    // и годится только как крайняя мера.
    const title =
      attrOrNull(doc.$('meta[itemprop=name]').first(), 'content') ??
      attrOrNull(doc.$('meta[name=name]').first(), 'content') ??
      textOrNull(doc.$('h1.cr-hero-names__main').first()) ??
      doc.$('title').text();

    // Альтернативные названия сайт выводит одной строкой через «/» («Jujutsu Kaisen / 呪術廻戦 /
    // Sorcery Fight»), а раньше держал списком в поповере — собираем из обоих мест.
    const altTitles = [
      ...new Set(
        [
          attrOrNull(doc.$('meta[itemprop=alternativeHeadline]').first(), 'content'),
          ...(textOrNull(doc.$('.cr-hero-names__alt').first())?.split('/') ?? []),
          ...doc
            .$('.all-names-popover .name')
            .toArray()
            .map((el) => textOrNull(doc.$(el))),
        ]
          .map((value) => nullIfEmpty(value ?? null))
          .filter((value): value is string => value !== null),
      ),
    ].filter((value) => value !== title.trim());

    const textsOf = (el: Cheerio<AnyNode>): string[] => [
      ...new Set(
        el
          .toArray()
          .map((node) => nullIfEmpty(textOrNull(doc.$(node))))
          .filter((t): t is string => t !== null),
      ),
    ];

    // Старая вёрстка: три отдельные строки в subject-meta, каждая — своя роль.
    const legacyAuthors = textsOf(
      root.find('.elem_author,.elem_screenwriter').find('a.person-link'),
    );
    const legacyArtists = textsOf(root.find('.elem_illustrator').find('a.person-link'));
    const legacyPublishers = textsOf(root.find('.elem_publisher').find('a.element-link'));
    const legacyMagazines = textsOf(root.find('.elem_gournal').find('a.element-link'));

    // Новая вёрстка (`.cr-main-persons`): каждая карточка несёт свою роль текстом
    // (`.cr-main-person-item__role` — «Автор»/«Авторы», «Сценарист», «Художник», «Переводчик»/
    // «Основной переводчик») — так что роли не нужно ни угадывать, ни вычитать переводчиков
    // постфактум. Несколько человек с одной ролью («Авторы») сидят в одной карточке как несколько
    // соседних `.cr-main-person-item__name` — берём их все, а не только первого.
    const heroAuthors: string[] = [];
    const heroArtists: string[] = [];
    doc.$('.cr-main-persons .cr-main-person-item').each((_, el) => {
      const item = doc.$(el);
      const role = textOrNull(item.find('.cr-main-person-item__role').first())?.toLowerCase();
      if (!role) return;
      if (role.includes('переводчик')) return; // покрыто отдельно через .cr-teams ниже
      const names = item
        .find('.cr-main-person-item__name')
        .toArray()
        .map((nameEl) => nullIfEmpty(textOrNull(doc.$(nameEl))))
        .filter((n): n is string => n !== null);
      if (role.includes('художник')) heroArtists.push(...names);
      else heroAuthors.push(...names); // «Автор»/«Авторы», «Сценарист» и другие текстовые роли
    });

    // Новая вёрстка (`.cr-info-details-item`) — тот же виджет, что отдаёт «Выпуск»/«Перевод» ниже,
    // но для «Журнал»/«Издательство» несёт не статус, а список ссылок/текстовых элементов
    // (`.cr-info-details-item__element`).
    const infoDetailsElements = (label: string): string[] => {
      let result: string[] = [];
      doc.$('.cr-info-details-item').each((_, el) => {
        const item = doc.$(el);
        if (textOrNull(item.find('.cr-info-details-item__title').first()) === label) {
          result = textsOf(item.find('.cr-info-details-item__element'));
        }
      });
      return result;
    };
    const heroPublishers = infoDetailsElements('Издательство');
    const heroMagazines = infoDetailsElements('Журнал');

    const authors = [...new Set([...legacyAuthors, ...heroAuthors])];
    const artists = [...new Set([...legacyArtists, ...heroArtists])];
    const publishers = [...new Set([...legacyPublishers, ...heroPublishers])];
    const magazines = [...new Set([...legacyMagazines, ...heroMagazines])];

    // `.cr-teams` — вкладка «Переводчики» с полным списком команд тайтла; надёжнее одной карточки
    // «Основной переводчик» и не требует угадывания разметки. На старой вёрстке (где вкладки нет)
    // остаётся резервный вариант — переводчики по главам (title-атрибут ссылки на главу).
    const teamTranslators = textsOf(doc.$('.cr-teams .cr-team-item__name'));
    const chapterTranslators = [
      ...new Set(chapters.map((c) => c.scanlator).filter((s): s is string => s !== null)),
    ];
    const translators = teamTranslators.length > 0 ? teamTranslators : chapterTranslators;

    // Ссылка на категорию в `.cr-hero-short-details__item` больше не несёт класс `element-link`
    // (снят при редизайне) — матчим по одному только href, чтобы не терять type молча.
    const categoryText = nullIfEmpty(
      textOrNull(doc.$(".cr-hero-short-details__item a[href*='/list/category/']").first()),
    );
    const type = mangaTypeByCategory(categoryText);

    const yearText = nullIfEmpty(
      textOrNull(doc.$(".cr-hero-short-details__item[href*='/list/year/']").first()) ??
        textOrNull(root.find('.elem_year').find('a.element-link').first()) ??
        textOrNull(root.find('.elem_year').first()),
    );
    const year = yearText ? parseIntOrNull(yearText.replace(/\D+/g, '')) : null;

    const votesText = textOrNull(
      mangaBox.find('.cr-hero-rating__item--main .cr-hero-rating__text').first(),
    );
    const votesCount = votesText ? parseIntOrNull(votesText.replace(/\D+/g, '')) : null;

    // Формат выпуска («В цвете», «Веб») — те же catalog-элементы, что и жанры/теги, но с типом
    // `another` (см. GROUPLE_ELEMENT_TYPE.ANOTHER) и своим href-префиксом `/list/another/`.
    const releaseFormats = [...new Set(textsOf(doc.$('.creation-element-tags__item--misc')))];

    // `.cr-info-details-item` — общий виджет статусов на новой вёрстке: «Выпуск»
    // (data-production-status, статус оригинала) и «Перевод» (data-translation-status, статус
    // перевода этим источником) рендерятся одним и тем же компонентом, различаясь только
    // заголовком строки.
    const infoStatusCode = (label: string, attr: string): string | null => {
      let result: string | null = null;
      doc.$('.cr-info-details-item').each((_, el) => {
        const item = doc.$(el);
        if (textOrNull(item.find('.cr-info-details-item__title').first()) === label) {
          result = attrOrNull(item.find(`[${attr}]`).first(), attr);
        }
      });
      return result;
    };
    const releaseState = mapInfoStatus(infoStatusCode('Выпуск', 'data-production-status'));
    const translationState = mapInfoStatus(infoStatusCode('Перевод', 'data-translation-status'));

    // «Количество читателей» — единственный имеющийся на источнике аналог счётчика просмотров.
    let viewsText: string | null = null;
    doc.$('.cr-info-panel').each((_, el) => {
      const panel = doc.$(el);
      if (
        textOrNull(panel.find('.cr-info-panel__title span').first())?.trim() ===
        'Количество читателей'
      ) {
        viewsText = textOrNull(panel.find('.cr-info-panel__title a').first());
      }
    });
    const views = viewsText ? parseIntOrNull((viewsText as string).replace(/\D+/g, '')) : null;

    return {
      id: generateUid(cfg.id, mangaUrl),
      title: title.trim(),
      altTitles,
      url: mangaUrl,
      publicUrl: finalUrl,
      rating,
      contentRating: isRestricted
        ? null
        : hasNsfwAlert
          ? CONTENT_RATING.SUGGESTIVE
          : cfg.isNsfw
            ? CONTENT_RATING.ADULT
            : CONTENT_RATING.SAFE,
      coverUrl:
        (posterSlide.length ? attrOrNull(posterSlide, 'href') : null) ??
        attrOrNull(coverImg, 'src') ??
        attrOrNull(coverImg, 'data-src') ??
        attrOrNull(coverImg, 'data-thumb')?.replace('_p.', '.') ??
        null,
      largeCoverUrl:
        (posterSlide.length ? attrOrNull(posterSlide, 'href') : null) ??
        attrOrNull(coverImg, 'data-full') ??
        null,
      tags: [...tags.values()],
      releaseState,
      restriction: isRestricted ? TITLE_RESTRICTION.LEGAL : null,
      authors,
      artists,
      translators,
      publishers,
      magazines,
      year,
      votesCount,
      type,
      translationState,
      releaseFormats,
      views,
      description:
        doc.$('.cr-description__content').first().html() ??
        root.find('div.manga-description').first().html() ??
        attrOrNull(doc.$('meta[itemprop=description]').first(), 'content'),
      chapters,
      source: cfg.id,
    };
  };

  const resolvePageUrl = async (pipedUrl: string): Promise<string> => {
    const parts = pipedUrl.split('|');
    if (parts.length < 2) return pipedUrl;
    const path = parts[parts.length - 1]!;

    if (cachedPagesServer) {
      const url = concatUrl(`https://${cachedPagesServer}/`, path);
      if (await ctx.http.head(url, MIN_IMAGE_SIZE)) return url;
      cachedPagesServer = null;
    }

    const candidates = new Set<string>();
    for (let i = 0; i < parts.length - 1; i += 1) {
      const server = parts[i]!.trim() || `https://${domain}/`;
      candidates.add(concatUrl(server, path));
      const pathWithoutQuery = path.split('?')[0]!;
      candidates.add(concatUrl(server, pathWithoutQuery));
    }
    for (const candidate of candidates) {
      if (await ctx.http.head(candidate, MIN_IMAGE_SIZE)) {
        try {
          cachedPagesServer = new URL(candidate).host;
        } catch {
          /* keep cachedPagesServer unset */
        }
        return candidate;
      }
    }
    return candidates.values().next().value ?? pipedUrl;
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const url = new URL(chapterUrl, `https://${domain}/`);
    url.searchParams.set('mtr', '1');
    const doc = await ctx.http.getHtml(url.toString());
    const scripts = doc
      .$('script')
      .toArray()
      .map((el) => doc.$(el).html() ?? '');

    let rawPages: RawPage[] | null = null;
    for (const data of scripts) {
      const posV2 = data.indexOf('rm_h.readerDoInit(');
      if (posV2 !== -1) {
        rawPages = parsePagesV2(data, posV2, cfg.id);
        if (rawPages) break;
      }
      const posV1 = data.indexOf('rm_h.readerInit( 0,');
      if (posV1 !== -1) {
        rawPages = parsePagesV1(data, posV1, cfg.id);
        if (rawPages) break;
      }
      const posV3 = data.indexOf('.readerInit(');
      if (posV3 !== -1) {
        rawPages = parsePagesV3(data, posV3, domain, cfg.id);
        break;
      }
    }
    if (!rawPages) {
      throw new ParseError(`Pages list not found at ${chapterUrl}`, cfg.id);
    }

    const resolved: RawPage[] = [];
    for (const page of rawPages) {
      const absoluteUrl = await resolvePageUrl(page.url).catch(() => page.url);
      resolved.push({ ...page, url: absoluteUrl });
    }
    return resolved;
  };

  return {
    id: cfg.id,
    info: {
      id: cfg.id,
      title: catalogEntryFor(cfg.id).title,
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: cfg.isNsfw
        ? SOURCE_CONTENT_TYPE.HENTAI
        : cfg.id === SOURCE_ID.SELFMANGA
          ? SOURCE_CONTENT_TYPE.OTHER
          : SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      requiresVpn: catalogEntryFor(cfg.id).requiresVpn,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.ALPHABETICAL,
        SORT_ORDER.ADDED,
        SORT_ORDER.RATING,
        SORT_ORDER.LIKES,
        SORT_ORDER.RELEASED,
        SORT_ORDER.UPDATED,
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
    imageHeaders: () => ({ Referer: `https://${domain}/`, 'User-Agent': UserAgents.GROUPLE_ARORA }),
    async init() {
      if (cfg.authGateway === 'z.qawa.org') {
        await authenticateAllHentai(ctx.http, ctx.jar, cfg, ctx.credentials.allhentai, ctx.logger);
      } else {
        await authenticateGrouple(ctx.http, ctx.jar, ctx.credentials.grouple, ctx.logger);
      }
    },
  };
};

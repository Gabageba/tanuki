import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { RAW_MANGA_STATE } from '../../types';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  MANGA_TYPE,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type FilterRangePreset,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchOffsetNative } from '../../core/paging';
import type {
  RawManga,
  RawChapter,
  RawFilterGroup,
  RawFilterOption,
  RawMangaState,
  RawMangaType,
  RawPage,
  RawTag,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { concatUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, ownText, selectFirstOrThrow } from '../../core/html/selectors';
import { parseGroupleDate } from '../../core/text/dates';
import { parseFloatOrNull, parseIntOrNull } from '../../core/text/numbers';
import { toTitleCase, nullIfEmpty, findGroupValue } from '../../core/text/strings';
import { ParseError, SourceAuthRequiredError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';
import { catalogEntryFor } from '../catalog';
import { authenticateGrouple, authenticateAllHentai } from './auth';
import type { GroupleConfig } from './config';
import { GROUPLE_ELEMENT_TYPE, GROUPLE_TRANSLATION_STATUS } from './models';
import type {
  CatalogCategoryJson,
  CatalogItemJson,
  CatalogSearchResponseJson,
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

const DECADE_SIZE = 10;
const YEAR_RANGE_CUTOFF = 2000;

/** "Текущий год", the current-decade-so-far, a preset per full decade back to `YEAR_RANGE_CUTOFF`,
 *  then one trailing preset lumping everything older than that into "Раньше 2000". */
const getYearRangePresets = (minYear: number, maxYear: number): FilterRangePreset[] => {
  const presets: FilterRangePreset[] = [
    { id: 'current-year', label: 'Текущий год', min: maxYear, max: maxYear },
  ];
  const currentDecadeStart = Math.floor(maxYear / DECADE_SIZE) * DECADE_SIZE;
  if (currentDecadeStart < maxYear) {
    presets.push({
      id: `decade-${currentDecadeStart}`,
      label: `${currentDecadeStart}–${maxYear}`,
      min: currentDecadeStart,
      max: maxYear,
    });
  }
  for (
    let decadeStart = currentDecadeStart - DECADE_SIZE;
    decadeStart >= YEAR_RANGE_CUTOFF;
    decadeStart -= DECADE_SIZE
  ) {
    presets.push({
      id: `decade-${decadeStart}`,
      label: `${decadeStart}-е`,
      min: decadeStart,
      max: decadeStart + DECADE_SIZE - 1,
    });
  }
  if (minYear < YEAR_RANGE_CUTOFF) {
    presets.push({
      id: `before-${YEAR_RANGE_CUTOFF}`,
      label: `Раньше ${YEAR_RANGE_CUTOFF}`,
      min: minYear,
      max: YEAR_RANGE_CUTOFF - 1,
    });
  }
  return presets;
};

/** Element ids (genre/category/age rating/misc) all round-trip through the same
 *  includeElementIds/excludeElementIds params on the search API — see applySelectionParams. */
const ELEMENT_FILTER_GROUPS = new Set(['genre', 'category', 'ageRating', 'misc']);

const getSearchSortType = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.USER_RATING:
      return 'USER_RATING';
    case SORT_ORDER.ALPHABETICAL:
      return 'NAME';
    case SORT_ORDER.NEWEST:
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
    throw new ParseError('Invalid reader response', sourceId);
  }
  const firstArrayStart = tail.indexOf('[', openParen);
  if (firstArrayStart === -1) {
    throw new ParseError('Invalid reader response', sourceId);
  }
  const arrayLiteral = extractBalancedArray(tail, firstArrayStart);
  if (!arrayLiteral) {
    throw new ParseError('Invalid reader response', sourceId);
  }

  let arr: unknown[][];
  try {
    arr = JSON.parse(jsArrayLiteralToJson(arrayLiteral)) as unknown[][];
  } catch {
    throw new ParseError('Invalid reader response', sourceId);
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
      throw new SourceAuthRequiredError('Login required', cfg.id);
    }
    if (res.status === 404) {
      const cookies = await ctx.jar.getCookies(`https://${domain}/`);
      const hasAuthCookie = cookies.some(
        (c) => c.key === 'gwt' || (cfg.extraAuthCookies ?? []).includes(c.key),
      );
      if (!hasAuthCookie) {
        throw new SourceAuthRequiredError('Login required (soft 404)', cfg.id);
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

  const mapCatalogState = (status: GroupleTranslationStatus): RawMangaState | null => {
    switch (status) {
      case GROUPLE_TRANSLATION_STATUS.FINISHED:
        return RAW_MANGA_STATE.FINISHED;
      case GROUPLE_TRANSLATION_STATUS.PROGRESS:
        return RAW_MANGA_STATE.ONGOING;
      case GROUPLE_TRANSLATION_STATUS.POSTPONED:
        return RAW_MANGA_STATE.PAUSED;
      case GROUPLE_TRANSLATION_STATUS.NONE:
        return null;
    }
  };

  /** Catalog "category" — mirrors the site's own .catalog-kinds filter vocabulary. */
  const mangaTypeByCategory = (
    category: CatalogCategoryJson | null | undefined,
  ): RawMangaType | null => {
    switch (category?.name) {
      case 'Манга':
        return MANGA_TYPE.MANGA;
      case 'Манхва':
        return MANGA_TYPE.MANHWA;
      case 'Манхуа':
      case 'Маньхуа':
        return MANGA_TYPE.MANHUA;
      case 'Комикс':
        return MANGA_TYPE.COMICS;
      case undefined:
      case null:
        return null;
      default:
        return MANGA_TYPE.OTHER;
    }
  };

  const mapCatalogItem = (item: CatalogItemJson): RawManga => {
    const relUrl = `/${item.elementId.linkName}`;
    const tags: RawTag[] = (item.elements ?? [])
      .filter(
        (el) =>
          el.typeName === GROUPLE_ELEMENT_TYPE.GENRE || el.typeName === GROUPLE_ELEMENT_TYPE.TAG,
      )
      .map((el) => ({ title: toTitleCase(el.name), key: String(el.id), source: cfg.id }));

    return {
      id: generateUid(cfg.id, relUrl),
      title: item.name,
      altTitles: [],
      url: relUrl,
      publicUrl: `https://${domain}${relUrl}`,
      rating: item.rating && item.rating.voteCount > 0 ? item.rating.rate / 10 : RATING_UNKNOWN,
      contentRating: cfg.isNsfw ? CONTENT_RATING.ADULT : null,
      coverUrl: item.picUrl,
      tags,
      state: mapCatalogState(item.translationStatus),
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: cfg.id,
      type: mangaTypeByCategory(item.category),
      chaptersCount: item.chaptersCount ?? null,
    };
  };

  /**
   * `includeElementIds`/`excludeElementIds` cover genre, category, age rating ("limitation") and
   * misc ("another") alike — the site's own advanced-search UI splits them into separate sections,
   * but all four funnel into the same id space and query params (verified live: a captured request
   * with one selection checked in each of those four sections produced exactly 4 include + 4
   * exclude ids, matching ELEMENT_FILTER_GROUPS one-for-one). `searchFilter` follows the same
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
      } else if (filter.groupId === 'productionStatus') {
        url.searchParams.append(
          filter.exclude ? 'excludeProductionStatuses' : 'includeProductionStatuses',
          filter.key,
        );
      } else if (filter.groupId === 'translationStatus') {
        url.searchParams.append(
          filter.exclude ? 'excludeTranslationStatuses' : 'includeTranslationStatuses',
          filter.key,
        );
      } else if (filter.groupId === 'searchFilter') {
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
        'range' in f && f.groupId === 'year',
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
  ): Promise<RawManga[]> => {
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

  const getList = async (params: ListParams): Promise<RawManga[]> => {
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
    const response = await ctx.http.get(`https://${domain}/search/advanced`);
    const html = response.text();
    const maps = parseGroupleFilterMaps(html);
    const yearsMatch = GROUPLE_FILTER_YEARS_REGEX.exec(html);

    const groups: RawFilterGroup[] = [];
    const genres = optionsFromMap(maps.genre);
    if (genres.length > 0) {
      groups.push({
        id: 'genre',
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres,
      });
    }
    const categories = optionsFromMap(maps.category);
    if (categories.length > 0) {
      groups.push({
        id: 'category',
        title: 'Категории',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: categories,
      });
    }
    const ageRatings = optionsFromMap(maps.limitation);
    if (ageRatings.length > 0) {
      groups.push({
        id: 'ageRating',
        title: 'Возрастной рейтинг',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: ageRatings,
      });
    }
    const productionStatuses = optionsFromMap(maps.productionStatus);
    if (productionStatuses.length > 0) {
      groups.push({
        id: 'productionStatus',
        title: 'Статус выхода',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: productionStatuses,
      });
    }
    const translationStatuses = optionsFromMap(maps.translationStatus);
    if (translationStatuses.length > 0) {
      groups.push({
        id: 'translationStatus',
        title: 'Статус перевода',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: translationStatuses,
      });
    }
    if (yearsMatch) {
      const yearMin = Number.parseInt(yearsMatch[1]!, 10);
      const yearMax = Number.parseInt(yearsMatch[2]!, 10);
      groups.push({
        id: 'year',
        title: 'Год выпуска',
        type: FILTER_TYPE.RANGE,
        options: [],
        settings: {
          range: { min: yearMin, max: yearMax },
          presets: getYearRangePresets(yearMin, yearMax),
        },
      });
    }
    const searchFilters = optionsFromMap(maps.searchFilters);
    if (searchFilters.length > 0) {
      groups.push({
        id: 'searchFilter',
        title: 'Фильтры',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: searchFilters,
      });
    }
    const misc = optionsFromMap(maps.another);
    if (misc.length > 0) {
      groups.push({
        id: 'misc',
        title: 'Прочее',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: misc,
      });
    }
    return groups;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
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

    const finalUrl = doc.$('link[rel=canonical]').attr('href') ?? absoluteUrl;
    const chaptersList = doc.$('#chapters-list');
    let isRestricted = false;
    if (chaptersList.length === 0 && !root.text().includes(NO_CHAPTERS)) {
      if (root.text().includes(COPYRIGHT_ALERT)) {
        isRestricted = true;
      } else {
        throw new ParseError('No chapters found', cfg.id);
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
        branch: null,
        source: cfg.id,
      });
    });
    chapters.reverse();

    return {
      id: generateUid(cfg.id, mangaUrl),
      title: doc.$('meta[name=name]').attr('content') ?? doc.$('title').text(),
      altTitles: doc
        .$('.all-names-popover .name')
        .toArray()
        .map((el) => textOrNull(doc.$(el)))
        .filter((t): t is string => t !== null),
      url: mangaUrl,
      publicUrl: finalUrl,
      rating: RATING_UNKNOWN,
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
      state: isRestricted ? RAW_MANGA_STATE.RESTRICTED : null,
      authors: root
        .find('.elem_author,.elem_illustrator,.elem_screenwriter')
        .find('a.person-link')
        .toArray()
        .map((el) => textOrNull(doc.$(el)))
        .filter((t): t is string => t !== null),
      description: root.find('div.manga-description').first().html(),
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
      locale: 'ru',
      contentType: cfg.isNsfw
        ? SOURCE_CONTENT_TYPE.hentai
        : cfg.id === 'SELFMANGA'
          ? SOURCE_CONTENT_TYPE.other
          : SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      requiresVpn: catalogEntryFor(cfg.id).requiresVpn,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.ALPHABETICAL,
        SORT_ORDER.ADDED,
        SORT_ORDER.RATING,
        SORT_ORDER.USER_RATING,
        SORT_ORDER.NEWEST,
        SORT_ORDER.UPDATED,
      ],
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

import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  CONTENT_RATING,
  FILTER_TYPE,
  TITLE_STATE,
  TITLE_TYPE,
  SORT_ORDER,
  SOURCE_CONTENT_TYPE,
  type TitleState,
  SOURCE_LOCALE,
} from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { FilterSelection, ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type {
  RawTitle,
  RawChapter,
  RawPage,
  RawTag,
  RawTitleType,
  RawFilterGroup,
  RawFilterOption,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { parseHtml } from '../../core/html/dom';
import { attrOrNull, textOrNull, selectFirstOrThrow } from '../../core/html/selectors';
import { parseRuRelativeDate, parseRuFullDate, parseRuBareYear } from '../../core/text/dates';
import { parseIntOrNull, parseFloatOrNull } from '../../core/text/numbers';
import { toTitleCase, nullIfEmpty, findGroupValue } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';
import { FILTER_GROUP } from '../../core/filters/group';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.DESUME;
const PAGE_SIZE = 24;
const IMAGE_REFERER = 'https://x.desu.city/';

export const DESU_FILTER_GROUP = {
  KIND: FILTER_GROUP.KIND,
  GENRE: FILTER_GROUP.GENRE,
  TAG: FILTER_GROUP.TAG,
  STATUS: FILTER_GROUP.STATUS,
  RATING: FILTER_GROUP.RATING,
} as const;

const CHAPTER_ID_REGEX = /\.(\d+)\/?$/;
const CHAPTER_PATH_REGEX = /\/vol(\d+)\/ch([0-9.]+)\//;
// The chapter link text is always "[Том N. ]Глава M[ - <actual title>]" — volume/number already
// surface as their own RawChapter fields, so keeping this raw text as the title would just repeat
// "Глава 284" next to the "Гл.284" the UI already renders from `number`. Only the part after the
// dash, if any, is a real title.
const CHAPTER_TITLE_SUFFIX_REGEX = /^(?:Том\s*[\d.]+\.\s*)?Глава\s*[\d.]+\s*[-–—]\s*(.+)$/iu;
// The reader page no longer embeds a dir/prefix/image-array script (ClassicReaderApi.init
// replaced the old Reader.init) — it now only bootstraps a chapter id + api base path, and the
// page list comes from a follow-up JSON call built from those.
const READER_BOOTSTRAP_REGEX = /window\.MangaReader\s*=\s*(\{.*?\});/;
const CSS_URL_REGEX = /url\((['"]?)([^'")]+)\1\)/;

type ReaderBootstrapJson = {
  chapter: { id: number };
  apiBaseUrl: string;
};

type ReaderApiChapterJson = {
  chapter: {
    pages: { page: number; url: string }[];
  };
};

const toRelativePath = (href: string): string => {
  return href.startsWith('/') ? href : `/${href}`;
};

const extractCssUrl = (css: string): string | null => {
  return CSS_URL_REGEX.exec(css)?.[2] ?? null;
};

const toLargeCoverUrl = (coverUrl: string): string => {
  return coverUrl.replace(/\/(preview|snippet|x120)\//, '/original/');
};

/**
 * `.b-anime_status_tag` class, shared by the details page's "Статус:" (release: ongoing/released)
 * and "Перевод:" (translation: continued/completed) lines — the same four-value vocabulary the
 * catalog's own .catalog-status filter uses (see fetchFilters' data-status options).
 */
const mangaStateByClass = (cls: string | null): TitleState | null => {
  if (cls === 'ongoing' || cls === 'continued') return TITLE_STATE.ONGOING;
  if (cls === 'released' || cls === 'completed') return TITLE_STATE.FINISHED;
  return null;
};

/** "Тип:" label — mirrors the .catalog-kinds filter's own vocabulary (data-kind values). Shared
 *  by catalog cards and the details page, which render the same label/value pair. */
const mangaTypeByLabel = (label: string | null): RawTitleType | null => {
  switch (label) {
    case 'Манга':
      return TITLE_TYPE.MANGA;
    case 'Манхва':
      return TITLE_TYPE.MANHWA;
    case 'Манхуа':
    case 'Маньхуа':
      return TITLE_TYPE.MANHUA;
    case 'Комикс':
      return TITLE_TYPE.COMICS;
    case null:
      return null;
    default:
      return TITLE_TYPE.OTHER;
  }
};

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.ALPHABETICAL:
      return 'name';
    case SORT_ORDER.POPULARITY:
      return 'popular';
    case SORT_ORDER.RELEASED:
      return 'id';
    default:
      return 'updated';
  }
};

/**
 * dl.pairsInline label/value pairs on catalog cards. A single dl can pack more than one pair —
 * e.g. "Тип:"/"Год:" and "Рейтинг:"/"Подписчики:" each share one dl — so every dt/dd inside a dl
 * must be checked, not just the first.
 */
const pairValue = ($li: Cheerio<AnyNode>, label: string): string | null => {
  const dls = $li.find('dl.pairsInline').toArray();
  for (const dl of dls) {
    const $dl = $li.find(dl);
    const dts = $dl.find('dt').toArray();
    const dds = $dl.find('dd').toArray();
    for (let i = 0; i < dts.length; i++) {
      if (textOrNull($li.find(dts[i]!)) === label) {
        return textOrNull($li.find(dds[i]!));
      }
    }
  }
  return null;
};

/** .line-container .line label/value rows on the details page, e.g. "Статус:". */
const detailValue = ($root: Cheerio<AnyNode>, label: string): Cheerio<AnyNode> | null => {
  const lines = $root.find('.line-container .line').toArray();
  for (const el of lines) {
    const $line = $root.find(el);
    if (textOrNull($line.find('.key').first()) === label) {
      return $line.find('.value').first();
    }
  }
  return null;
};

/** The `.b-anime_status_tag` class off a detailValue() result, e.g. "ongoing" or "continued". */
const statusTagClass = ($value: Cheerio<AnyNode> | null): string | null => {
  const $tag = $value?.find('.b-anime_status_tag').first();
  if (!$tag || $tag.length === 0) return null;
  return (
    $tag
      .attr('class')
      ?.split(/\s+/)
      .find((c) => c !== 'b-anime_status_tag') ?? null
  );
};

/**
 * `(1234)` count trailing a .filter-control-checkbox — only .catalog-genres items carry one
 * (a plain <span> with no class, styled inline); kinds/status render no count at all. Tag items
 * additionally nest a no-class `#` marker span inside .filter-control-text, ahead of the count
 * in document order, so the count must be the *last* such span, not the first.
 */
const parseFilterCount = ($control: Cheerio<AnyNode>): number | null => {
  const text = textOrNull($control.find('span:not([class])').last());
  return text ? parseIntOrNull(text.replace(/[()]/g, '')) : null;
};

/** .catalog-kinds / .catalog-status li — plain include-only checkbox (value cycles 0/1 only). */
const parseCheckboxOption = ($li: Cheerio<AnyNode>, dataAttr: string): RawFilterOption | null => {
  const $control = $li.find('.filter-control').first();
  const key = attrOrNull($control.find('input').first(), dataAttr);
  const title = textOrNull($control.find('.filter-control-text').first());
  if (!key || !title) return null;
  return { key, title, count: parseFilterCount($control) };
};

/**
 * .catalog-genres packs genres and tags into the same list under one data-genre-* id space —
 * the only visible difference is a `#` marker span the site prepends to a tag's label. Genre and
 * tag options otherwise parse identically, so callers split on this and reuse the same option
 * shape for both groups.
 */
const isTagOption = ($control: Cheerio<AnyNode>): boolean => {
  const text = textOrNull($control.find('.filter-control-text').first()) ?? '';
  return text.trim().startsWith('#');
};

/**
 * .catalog-genres li — tri-state checkbox (value cycles 0/1/2: unset/include/exclude). The site
 * addresses one by `data-genre-id + '-' + data-genre-slug` (see Manga.js updateCatalogUrl), so
 * the option key mirrors that exactly — it's what fetchCatalogPage sends back unchanged.
 */
const parseGenreOption = ($li: Cheerio<AnyNode>): RawFilterOption | null => {
  const $control = $li.find('.filter-control').first();
  const input = $control.find('input').first();
  const id = attrOrNull(input, 'data-genre-id');
  const slug = attrOrNull(input, 'data-genre-slug');
  const name = attrOrNull(input, 'data-genre-name');
  if (!id || !slug || !name) return null;
  return { key: `${id}-${slug}`, title: toTitleCase(name), count: parseFilterCount($control) };
};

export const createDesuParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let tagsPromise: Promise<Map<string, RawTag>> | null = null;

  const getTagsMap = (): Promise<Map<string, RawTag>> => {
    if (!tagsPromise) tagsPromise = fetchTags();
    return tagsPromise;
  };

  const fetchTags = async (): Promise<Map<string, RawTag>> => {
    const doc = await ctx.http.getHtml(`https://${domain}/manga/`);
    const filterRoot = selectFirstOrThrow(doc.$.root(), '#animeFilter', SOURCE_ID, 'fetchTags');
    const genresRoot = selectFirstOrThrow(filterRoot, '.catalog-genres', SOURCE_ID, 'fetchTags');
    const result = new Map<string, RawTag>();
    genresRoot
      .find('li')
      .toArray()
      .forEach((el) => {
        const $li = doc.$(el);
        const input = $li.find('input').first();
        const id = attrOrNull(input, 'data-genre-id');
        const slug = attrOrNull(input, 'data-genre-slug');
        const name = attrOrNull(input, 'data-genre-name');
        if (!id || !slug || !name) return;
        const title = toTitleCase(name);
        result.set(title, { source: SOURCE_ID, key: `${id}-${slug}`, title });
      });
    return result;
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const doc = await ctx.http.getHtml(`https://${domain}/manga/`);
    const filterRoot = selectFirstOrThrow(doc.$.root(), '#animeFilter', SOURCE_ID, 'fetchFilters');

    const kinds = filterRoot
      .find('.catalog-kinds li')
      .toArray()
      .map((el) => parseCheckboxOption(doc.$(el), 'data-kind'))
      .filter((o): o is RawFilterOption => o !== null);

    const genres: RawFilterOption[] = [];
    const tags: RawFilterOption[] = [];
    filterRoot
      .find('.catalog-genres li')
      .toArray()
      .forEach((el) => {
        const $li = doc.$(el);
        const option = parseGenreOption($li);
        if (!option) return;
        const $control = $li.find('.filter-control').first();
        (isTagOption($control) ? tags : genres).push(option);
      });

    // The site renders "Без 18+" as just another <li data-status="no18plus"> inside
    // .catalog-status, but it's an age-rating toggle, not a publication status — split it into
    // its own group so it doesn't show up under "Статус". applyFilterParams folds it back into
    // the shared `status` query param, since that's the one attribute the site's own JS reads.
    const allStatuses = filterRoot
      .find('.catalog-status li')
      .toArray()
      .map((el) => parseCheckboxOption(doc.$(el), 'data-status'))
      .filter((o): o is RawFilterOption => o !== null);
    const statuses = allStatuses.filter((o) => o.key !== 'no18plus');
    const ratings = allStatuses.filter((o) => o.key === 'no18plus');

    const groups: RawFilterGroup[] = [];
    // kind/status: a handful of options, all visible at once → CHECKBOX. genre: 50+ options →
    // SEARCHABLE_CHECKBOX_EXCLUDE, so the client gets a scrollable, searchable list instead of a
    // wall of chips, plus the include/exclude cycling the genre filter supports.
    if (kinds.length > 0) {
      groups.push({
        id: DESU_FILTER_GROUP.KIND,
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX,
        options: kinds,
      });
    }
    if (genres.length > 0) {
      groups.push({
        id: DESU_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres,
      });
    }
    if (tags.length > 0) {
      groups.push({
        id: DESU_FILTER_GROUP.TAG,
        title: 'Теги',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: tags,
      });
    }
    if (statuses.length > 0) {
      groups.push({
        id: DESU_FILTER_GROUP.STATUS,
        title: 'Статус',
        type: FILTER_TYPE.CHECKBOX,
        options: statuses,
      });
    }
    if (ratings.length > 0) {
      groups.push({
        id: DESU_FILTER_GROUP.RATING,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: ratings,
      });
    }
    return groups;
  };

  /**
   * Mirrors Manga.js's updateCatalogUrl: kinds/status are plain comma-separated include lists,
   * genres pack the exclude marker between id and slug (`id-!slug`, not `!id-slug`) — id and
   * slug are re-split off FilterSelection.key, which fetchFilters built as `${id}-${slug}`.
   * "tag" selections fold into the same `genres` param as "genre" — the site addresses both out
   * of one data-genre-* id space, splitting them into two groups is a fetchFilters-side display
   * distinction (see isTagOption) that doesn't exist in the request the site's own JS sends.
   */
  const applyFilterParams = (url: URL, selections: FilterSelection[] | undefined): void => {
    if (!selections || selections.length === 0) return;
    // Desu has no RANGE groups — getFilters() never emits one, so a range selection here would
    // be a caller bug, not a real request. Narrowing up front keeps the rest of this function on
    // the plain key/exclude shape instead of re-checking 'range' in filter at every access below.
    const filters = selections.filter(
      (f): f is Extract<FilterSelection, { key: string }> => 'key' in f,
    );
    const byGroup = new Map<string, typeof filters>();
    for (const filter of filters) {
      const list = byGroup.get(filter.groupId) ?? [];
      list.push(filter);
      byGroup.set(filter.groupId, list);
    }

    const kinds = byGroup.get(DESU_FILTER_GROUP.KIND);
    if (kinds?.length) url.searchParams.set('kinds', kinds.map((f) => f.key).join(','));

    const statusKeys = [
      ...(byGroup.get(DESU_FILTER_GROUP.STATUS) ?? []),
      ...(byGroup.get(DESU_FILTER_GROUP.RATING) ?? []),
    ].map((f) => f.key);
    if (statusKeys.length) url.searchParams.set('status', statusKeys.join(','));

    const genres = [
      ...(byGroup.get(DESU_FILTER_GROUP.GENRE) ?? []),
      ...(byGroup.get(DESU_FILTER_GROUP.TAG) ?? []),
    ];
    if (genres.length) {
      const genreParams = genres.map((f) => {
        const separatorIndex = f.key.indexOf('-');
        if (separatorIndex < 0) return f.key;
        const id = f.key.slice(0, separatorIndex);
        const slug = f.key.slice(separatorIndex + 1);
        return f.exclude ? `${id}-!${slug}` : `${id}-${slug}`;
      });
      url.searchParams.set('genres', genreParams.join(','));
    }
  };

  const parseTagFromLink = ($a: Cheerio<AnyNode>): RawTag | null => {
    const href = attrOrNull($a, 'href') ?? '';
    const key = nullIfEmpty(href.split('genres=')[1]?.split('&')[0] ?? '');
    const title = nullIfEmpty((textOrNull($a) ?? '').replace(/^#/, '').trim());
    if (!key || !title) return null;
    return { key, title: toTitleCase(title), source: SOURCE_ID };
  };

  const parseMangaItem = (
    $li: Cheerio<AnyNode>,
    baseUrl: string,
    tagsMap: Map<string, RawTag>,
  ): RawTitle | null => {
    const titleLink = $li.find('h3 a.animeTitle').first();
    const href = attrOrNull(titleLink, 'href');
    if (!href) return null;
    const id = CHAPTER_ID_REGEX.exec(href)?.[1];
    if (!id) return null;
    const url = toRelativePath(href);
    const avatarLink = $li.find('a.avatar').first();
    const bgImage = avatarLink.find('span.img').first().attr('style');
    const coverUrl = bgImage ? extractCssUrl(bgImage) : null;
    const russianTitle = nullIfEmpty(textOrNull($li.find('.dimmed.oTitle').first()) ?? '');
    const originalTitle = textOrNull(titleLink) ?? '';
    const genreNames = (pairValue($li, 'Жанры:') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const tags = genreNames
      .map((name) => tagsMap.get(toTitleCase(name)))
      .filter((t): t is RawTag => t !== undefined);
    const ratingText = pairValue($li, 'Рейтинг:');
    const rating = parseFloatOrNull(ratingText);
    const type = mangaTypeByLabel(pairValue($li, 'Тип:'));
    const year = parseIntOrNull(pairValue($li, 'Год:'));
    return {
      id: generateUid(SOURCE_ID, id),
      title: russianTitle ?? originalTitle,
      altTitles: originalTitle !== russianTitle ? [originalTitle] : [],
      url,
      publicUrl: new URL(url, baseUrl).toString(),
      rating: rating !== null ? Math.min(Math.max(rating / 10, 0), 1) : RATING_UNKNOWN,
      contentRating: avatarLink.hasClass('age_18_plus') ? CONTENT_RATING.ADULT : null,
      coverUrl,
      largeCoverUrl: coverUrl ? toLargeCoverUrl(coverUrl) : null,
      tags,
      releaseState: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type,
      year,
    };
  };

  /** Quick-search results carry only cover + two title variants — getDetails fills the rest. */
  const parseSearchItem = ($li: Cheerio<AnyNode>, baseUrl: string): RawTitle | null => {
    const $a = $li.find('a.AniMangaSearchCard__link').first();
    const href = attrOrNull($a, 'href');
    if (!href) return null;
    const id = CHAPTER_ID_REGEX.exec(href)?.[1];
    if (!id) return null;
    const url = toRelativePath(href);
    const coverUrl = attrOrNull($a.find('img').first(), 'src');
    const russianTitle = nullIfEmpty(
      textOrNull($a.find('.AniMangaSearchCard__title').first()) ?? '',
    );
    const originalTitle = nullIfEmpty(
      textOrNull($a.find('.AniMangaSearchCard__subtitle').first()) ?? '',
    );
    if (!russianTitle && !originalTitle) return null;
    return {
      id: generateUid(SOURCE_ID, id),
      title: russianTitle ?? originalTitle!,
      altTitles: originalTitle && originalTitle !== russianTitle ? [originalTitle] : [],
      url,
      publicUrl: new URL(url, baseUrl).toString(),
      rating: RATING_UNKNOWN,
      contentRating: null,
      coverUrl,
      largeCoverUrl: coverUrl ? toLargeCoverUrl(coverUrl) : null,
      tags: [],
      releaseState: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const parseChapterItem = ($li: Cheerio<AnyNode>): RawChapter | null => {
    const $a = $li.find('h4 a').first();
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw) return null;
    const url = toRelativePath(hrefRaw);
    const chapterIdRaw = attrOrNull($li.find('i.chDownload').first(), 'data-chapters_id');
    const chapterId = chapterIdRaw
      ? generateUid(SOURCE_ID, chapterIdRaw)
      : generateUid(SOURCE_ID, url);
    const match = CHAPTER_PATH_REGEX.exec(url);
    const volume = match ? parseIntOrNull(match[1]!) : null;
    const number = match ? parseFloatOrNull(match[2]!) : null;
    const date = textOrNull($li.find('span.date').first());
    return {
      id: chapterId,
      source: SOURCE_ID,
      url,
      uploadDate: parseRuRelativeDate(date),
      title: nullIfEmpty(findGroupValue(textOrNull($a) ?? '', CHAPTER_TITLE_SUFFIX_REGEX)),
      volume,
      number,
      scanlator: null,
      branch: null,
    };
  };

  const search = async (query: string): Promise<RawTitle[]> => {
    const res = await ctx.http.postForm(
      `https://${domain}/manga/search/`,
      { q: query, _xfToken: '', _xfNoRedirect: '1', _xfResponseType: 'json' },
      { 'X-Requested-With': 'XMLHttpRequest' },
    );
    let templateHtml: string | undefined;
    try {
      templateHtml = res.json<{ templateHtml?: string }>().templateHtml;
    } catch {
      return [];
    }
    if (!templateHtml) return [];
    const doc = parseHtml(templateHtml, `https://${domain}/`);
    return doc
      .$('li.AniMangaSearchCard')
      .toArray()
      .map((el) => parseSearchItem(doc.$(el), doc.baseUrl))
      .filter((m): m is RawTitle => m !== null);
  };

  const fetchCatalogPage = async (
    page: number,
    order: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawTitle[]> => {
    const url = new URL(`https://${domain}/manga/`);
    const orderBy = getSortKey(order);
    if (orderBy !== 'updated') url.searchParams.set('order_by', orderBy);
    if (page > 1) url.searchParams.set('page', String(page));
    applyFilterParams(url, filters);
    const [doc, tagsMap] = await Promise.all([ctx.http.getHtml(url.toString()), getTagsMap()]);
    return doc
      .$('li.memberListItem')
      .toArray()
      .map((el) => parseMangaItem(doc.$(el), doc.baseUrl, tagsMap))
      .filter((m): m is RawTitle => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, async (page) => {
      if (params.query) {
        return page === 1 ? search(params.query!) : [];
      }
      return fetchCatalogPage(page, params.order, params.filters);
    });
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const absoluteUrl = new URL(mangaUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const root = doc.$.root();

    const originalTitle = nullIfEmpty(textOrNull(doc.$('h1 .name').first()) ?? '');
    const russianTitle = nullIfEmpty(textOrNull(doc.$('h1 .rus-name').first()) ?? '');
    const altTitles = (textOrNull(doc.$('.alternativeHeadline').first()) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tags = doc
      .$('.c-info-left .tagList a[itemprop=genre]')
      .toArray()
      .map((el) => parseTagFromLink(doc.$(el)))
      .filter((t): t is RawTag => t !== null);

    const statusValue = detailValue(root, 'Статус:');
    const statusClass = statusTagClass(statusValue);
    // "Статус:" packs the release state tag and, right after it, a release date — either a full
    // "с 14 июн 2012 г." or, for some titles, just a bare "с 2022 г." with no day/month.
    const statusText = statusValue ? textOrNull(statusValue) : null;
    const releaseDate = parseRuFullDate(statusText);
    const year =
      releaseDate > 0 ? new Date(releaseDate).getUTCFullYear() : parseRuBareYear(statusText);

    // "Перевод:" is a separate line-container from "Статус:" — desu tracks the RU scanlation's
    // own progress (continued/completed) independently of the original's release state.
    const translationClass = statusTagClass(detailValue(root, 'Перевод:'));

    const typeValue = detailValue(root, 'Тип:');
    const type = mangaTypeByLabel(typeValue ? textOrNull(typeValue) : null);

    const authors = (detailValue(root, 'Авторы:')?.find('a').toArray() ?? [])
      .map((el) => textOrNull(doc.$(el)))
      .filter((a): a is string => a !== null);

    const translators = (detailValue(root, 'Переводчики:')?.find('a').toArray() ?? [])
      .map((el) => textOrNull(doc.$(el)))
      .filter((t): t is string => t !== null);

    const viewsValue = detailValue(root, 'Просмотров:');
    const views = parseIntOrNull(viewsValue ? textOrNull(viewsValue) : null);

    const ratingRaw = attrOrNull(doc.$('.b-rate').first(), 'data-score');
    const ratingValue = parseFloatOrNull(ratingRaw);
    const votesCount = parseIntOrNull(
      attrOrNull(doc.$('meta[itemprop=ratingCount]').first(), 'content'),
    );

    const description = nullIfEmpty(
      doc
        .$('#description .russian .prgrph')
        .toArray()
        .map((el) => doc.$(el).text())
        .join('\n\n'),
    );

    const chlist = selectFirstOrThrow(root, 'ul.chlist', SOURCE_ID, 'getDetails');
    const chapters = chlist
      .find('li')
      .toArray()
      .map((el) => parseChapterItem(doc.$(el)))
      .filter((c): c is RawChapter => c !== null)
      .reverse();

    // The seed manga apps/api sends only ever has `coverUrl: null` — re-derive it here or the
    // cover disappears on the details page (a regression the Kotlin fork hit once already
    // when this parser was rewritten for XenForo HTML).
    const coverUrl = attrOrNull(doc.$('.c-poster img[itemprop=image]').first(), 'src');

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title: russianTitle ?? originalTitle ?? mangaUrl,
      altTitles,
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: ratingValue !== null ? Math.min(Math.max(ratingValue / 10, 0), 1) : RATING_UNKNOWN,
      contentRating: null,
      coverUrl,
      largeCoverUrl: coverUrl ? toLargeCoverUrl(coverUrl) : null,
      tags,
      releaseState: mangaStateByClass(statusClass),
      translationState: mangaStateByClass(translationClass),
      authors,
      description,
      chapters,
      source: SOURCE_ID,
      type,
      year,
      releaseDate,
      originalTitle: originalTitle ? [originalTitle] : [],
      translators,
      votesCount,
      views,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const absoluteUrl = new URL(chapterUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const script = doc
      .$('script')
      .toArray()
      .map((el) => doc.$(el).html() ?? '')
      .find((s) => s.includes('window.MangaReader'));
    if (!script) throw new ParseError(`Reader bootstrap not found: ${absoluteUrl}`, SOURCE_ID);

    const bootstrapJson = READER_BOOTSTRAP_REGEX.exec(script)?.[1];
    if (!bootstrapJson) throw new ParseError(`Invalid reader response: ${absoluteUrl}`, SOURCE_ID);
    let bootstrap: ReaderBootstrapJson;
    try {
      bootstrap = JSON.parse(bootstrapJson) as ReaderBootstrapJson;
    } catch {
      throw new ParseError(`Invalid reader response: ${absoluteUrl}`, SOURCE_ID);
    }

    const { chapter } = await ctx.http.getJson<ReaderApiChapterJson>(
      `https://${domain}${bootstrap.apiBaseUrl}/chapters/${bootstrap.chapter.id}`,
    );
    if (chapter.pages.length === 0)
      throw new ParseError(`No pages found: ${absoluteUrl}`, SOURCE_ID);

    return chapter.pages.map((page) => ({
      id: generateUid(SOURCE_ID, page.url),
      url: page.url,
      preview: null,
      source: SOURCE_ID,
    }));
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Desu',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        SORT_ORDER.POPULARITY,
        SORT_ORDER.UPDATED,
        SORT_ORDER.ADDED,
        SORT_ORDER.ALPHABETICAL,
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
    imageHeaders: () => ({ Referer: IMAGE_REFERER, 'User-Agent': UserAgents.KOTATSU }),
  };
};

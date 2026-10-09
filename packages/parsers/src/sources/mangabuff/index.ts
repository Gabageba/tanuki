import type { Cheerio, CheerioAPI } from 'cheerio';
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
  RawContentRating,
  RawFilterGroup,
  RawFilterOption,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { parseHtml } from '../../core/html/dom';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl, ownText } from '../../core/html/selectors';
import { parseFloatOrNull, parseIntOrNull } from '../../core/text/numbers';
import { nullIfEmpty } from '../../core/text/strings';
import { parseDdMmYyyy } from '../../core/text/dates';
import { ParseError, SourceUnavailableError } from '../../errors';
import { FILTER_GROUP } from '../../core/filters/group';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.MANGABUFF;
const PAGE_SIZE = 24;
const CHAPTER_SELECTOR = 'a.chapters__item';
const CHAPTER_NUMBER_REGEX = /\d+(?:[.,]\d+)?/;

export const MANGABUFF_FILTER_GROUP = {
  GENRE: FILTER_GROUP.GENRE,
  TYPE: FILTER_GROUP.TYPE,
  TAG: FILTER_GROUP.TAG,
  STATUS: FILTER_GROUP.STATUS,
  AGE_RATING: FILTER_GROUP.AGE_RATING,
  RATING: FILTER_GROUP.RATING,
  YEAR: FILTER_GROUP.YEAR,
  CHAPTERS_COUNT: FILTER_GROUP.CHAPTERS_COUNT,
} as const;

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.POPULARITY:
      return 'real_views';
    case SORT_ORDER.RATING:
      return 'rating';
    case SORT_ORDER.ADDED:
      return 'created_at';
    default:
      return 'updated_at';
  }
};

const parseStatus = (value: string): TitleState | null => {
  switch (value.toLowerCase().trim()) {
    case 'завершен':
      return TITLE_STATE.FINISHED;
    case 'продолжается':
      return TITLE_STATE.ONGOING;
    case 'заморожен':
      return TITLE_STATE.PAUSED;
    case 'заброшен':
      return TITLE_STATE.ABANDONED;
    default:
      return null;
  }
};

/** Catalog "Тип:" badge (`.cards__info` on list cards, the `/types/<slug>` link on the details
 *  page) — mirrors the type_id[] filter's own vocabulary (Манга, OEL-манга, Манхва, Маньхуа,
 *  Сингл, Руманга, Комикс западный). Only the unambiguous ones get their own case. */
const mangaTypeByLabel = (label: string | null): RawTitleType | null => {
  switch (label) {
    case 'Манга':
      return TITLE_TYPE.MANGA;
    case 'Манхва':
      return TITLE_TYPE.MANHWA;
    case 'Маньхуа':
      return TITLE_TYPE.MANHUA;
    case 'Комикс западный':
      return TITLE_TYPE.COMICS;
    case null:
      return null;
    default:
      return TITLE_TYPE.OTHER;
  }
};

/** "18+"/"16+" badge next to the genre tags (`.tags__item--warning`) — the only content-rating
 *  signal the site exposes, mirrors the age_rating[] filter's own vocabulary. */
const contentRatingByLabel = (label: string | null): RawContentRating | null => {
  switch (label) {
    case '18+':
      return CONTENT_RATING.ADULT;
    case '16+':
      return CONTENT_RATING.SUGGESTIVE;
    default:
      return null;
  }
};

/** Genre/tag names on `?view=card-detailed` cards carry no href, unlike the details page's own
 *  `.tags` anchors — so their key is always derived from the title, same fallback both use. */
const slugifyTitle = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

type MiddleLinks = { type: RawTitleType | null; year: number | null; stateText: string | null };

/**
 * `.manga__middle-links`/`.manga-mobile__info` packs the type/year/status links together, but
 * a title can be missing one (year isn't always known) — so they're told apart by href shape
 * (`/types/<slug>`, `/types/<slug>/<year>`, `/manga?status_id[]=`), not by position.
 */
const parseMiddleLinks = ($: CheerioAPI): MiddleLinks => {
  const result: MiddleLinks = { type: null, year: null, stateText: null };
  $('.manga__middle-links > a, .manga-mobile__info > a').each((_, el) => {
    const $a = $(el);
    const path = (attrOrNull($a, 'href') ?? '').replace(/^https?:\/\/[^/]+/, '');
    if (/^\/types\/[^/]+\/\d{4}$/.test(path)) {
      result.year = parseIntOrNull(textOrNull($a));
    } else if (/^\/types\/[^/]+$/.test(path)) {
      result.type = mangaTypeByLabel(textOrNull($a));
    } else if (path.startsWith('/manga?status_id')) {
      result.stateText = textOrNull($a);
    }
  });
  return result;
};

/** `<select name="X[]"><option value=...>Title</option>...</select>` — genres/type/tags/status/
 *  age_rating/rating/year all share this same shape on the catalog's filter form. */
const parseSelectOptions = ($: CheerioAPI, selectName: string): RawFilterOption[] => {
  return $(`select[name="${selectName}"] option`)
    .toArray()
    .map((el): RawFilterOption | null => {
      const $option = $(el);
      const key = attrOrNull($option, 'value');
      const title = textOrNull($option);
      if (!key || !title) return null;
      return { key, title, count: null };
    })
    .filter((o): o is RawFilterOption => o !== null);
};

/** "Количество глав" isn't a <select> like the rest — it's four plain checkboxes, each labelling
 *  a bucket boundary (<50, 50-100, 100-200, >200) via a sibling <span>, not the input's own text. */
const parseChaptersCountOptions = ($: CheerioAPI): RawFilterOption[] => {
  return $('.catalog__chapters input[name="chapters[]"]')
    .toArray()
    .map((el): RawFilterOption | null => {
      const $input = $(el);
      const key = attrOrNull($input, 'value');
      const title = textOrNull($input.next('span'));
      if (!key || !title) return null;
      return { key, title, count: null };
    })
    .filter((o): o is RawFilterOption => o !== null);
};

export const createMangaBuffParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let csrfToken: string | null = null;

  const parseMangaCard = ($item: Cheerio<AnyNode>, baseUrl: string): RawTitle | null => {
    // cards__item is the anchor itself; the site no longer nests a separate <a>.
    const hrefRaw = attrOrNull($item, 'href');
    if (!hrefRaw) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const slug = relUrl.replace(/\/$/, '').split('/').pop() ?? relUrl;
    const title =
      nullIfEmpty(textOrNull($item.find('.cards__name').first())) ??
      nullIfEmpty(textOrNull($item)) ??
      slug;
    // Cover is a CSS background-image on .cards__img, not an <img src>.
    const style = attrOrNull($item.find('.cards__img').first(), 'style');
    const bgMatch = style ? /url\((['"]?)(.*?)\1\)/.exec(style) : null;
    const coverUrl = bgMatch
      ? new URL(bgMatch[2] ?? '', baseUrl).toString()
      : `https://${domain}/img/manga/posters/${slug}.jpg`;

    const ratingRaw = textOrNull($item.find('.cards__rating').first());
    const ratingPct = ratingRaw ? parseFloatOrNull(ratingRaw.replace(',', '.')) : null;
    // ".cards__info" is "<Тип>, <Жанр>" — only the type half matches the type_id[] vocabulary.
    const infoType = textOrNull($item.find('.cards__info').first())?.split(',')[0]?.trim() ?? null;

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: [],
      url: relUrl,
      publicUrl,
      rating: ratingPct !== null ? ratingPct / 10 : RATING_UNKNOWN,
      contentRating: null,
      coverUrl,
      tags: [],
      releaseState: null,
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: mangaTypeByLabel(infoType),
    };
  };

  const parseMangaList = (doc: { $: CheerioAPI; baseUrl: string }): RawTitle[] => {
    return doc
      .$('.cards .cards__item')
      .toArray()
      .map((el) => parseMangaCard(doc.$(el), doc.baseUrl))
      .filter((m): m is RawTitle => m !== null);
  };

  /** `?view=card-detailed` swaps `.cards__item` for `.cards-detailed__item`, trading the single
   *  `.cards__info` genre for the title's full genre list — still no description, the site never
   *  puts that in a list card. `/search` doesn't support the param, so it stays on `parseMangaCard`. */
  const parseMangaCardDetailed = ($item: Cheerio<AnyNode>, baseUrl: string): RawTitle | null => {
    const hrefRaw = attrOrNull($item, 'href');
    if (!hrefRaw) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const slug = relUrl.replace(/\/$/, '').split('/').pop() ?? relUrl;
    const title =
      nullIfEmpty(textOrNull($item.find('.cards-detailed__name').first())) ??
      nullIfEmpty(textOrNull($item)) ??
      slug;

    const imgSrc = attrOrNull($item.find('.cards-detailed__poster img').first(), 'src');
    const coverUrl = imgSrc
      ? new URL(imgSrc, baseUrl).toString()
      : `https://${domain}/img/manga/posters/${slug}.jpg`;

    // "<rating> <span><views></span>" — ownText strips the nested views span, leaving the rating.
    const ratingRaw = nullIfEmpty(ownText($item.find('.cards-detailed__info').first()));
    const ratingPct = ratingRaw ? parseFloatOrNull(ratingRaw.replace(',', '.')) : null;

    const typeLabel = textOrNull($item.find('.cards-detailed__type').first());

    const genresRaw = textOrNull($item.find('.cards-detailed__genres').first());
    const tags: RawTag[] = (genresRaw ?? '')
      .split(',')
      .map((genreTitle) => genreTitle.trim())
      .filter((genreTitle) => genreTitle.length > 0)
      .map((genreTitle) => ({
        title: genreTitle,
        key: slugifyTitle(genreTitle),
        source: SOURCE_ID,
      }));

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: [],
      url: relUrl,
      publicUrl,
      rating: ratingPct !== null ? ratingPct / 10 : RATING_UNKNOWN,
      contentRating: null,
      coverUrl,
      tags,
      releaseState: null,
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: SOURCE_ID,
      type: mangaTypeByLabel(typeLabel),
    };
  };

  const parseMangaListDetailed = (doc: { $: CheerioAPI; baseUrl: string }): RawTitle[] => {
    return doc
      .$('.cards-detailed .cards-detailed__item')
      .toArray()
      .map((el) => parseMangaCardDetailed(doc.$(el), doc.baseUrl))
      .filter((m): m is RawTitle => m !== null);
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
    filters: FilterSelection[] | undefined,
  ): Promise<RawTitle[]> => {
    const url = new URL(query ? `https://${domain}/search` : `https://${domain}/manga`);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.set('sort', getSortKey(order));
      url.searchParams.set('view', 'card-detailed');
      applyFilterParams(url, filters);
    }
    if (page !== 1) url.searchParams.set('page', String(page));

    const doc = await ctx.http.getHtml(url.toString());
    return query ? parseMangaList(doc) : parseMangaListDetailed(doc);
  };

  const getList = async (params: ListParams): Promise<RawTitle[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.query, params.filters),
    );
  };

  /**
   * genre/type/tag are the only groups with an exclude side — the site addresses it as a wholly
   * separate `without_*[]` param, not a marker packed into the same value (unlike Desu's
   * `id-!slug`), because its own filter form renders them as two side-by-side <select>s ("Фильтр"
   * vs "Исключить"). The rest are plain multi-selects/checkboxes with no exclude concept.
   */
  const applyFilterParams = (url: URL, filters: FilterSelection[] | undefined): void => {
    if (!filters || filters.length === 0) return;
    for (const filter of filters) {
      if ('range' in filter) continue; // MangaBuff has no RANGE groups.
      switch (filter.groupId) {
        case MANGABUFF_FILTER_GROUP.GENRE:
          url.searchParams.append(filter.exclude ? 'without_genres[]' : 'genres[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.TYPE:
          url.searchParams.append(filter.exclude ? 'without_type_id[]' : 'type_id[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.TAG:
          url.searchParams.append(filter.exclude ? 'without_tags[]' : 'tags[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.STATUS:
          url.searchParams.append('status_id[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.AGE_RATING:
          url.searchParams.append('age_rating[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.RATING:
          url.searchParams.append('rating[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.YEAR:
          url.searchParams.append('year[]', filter.key);
          break;
        case MANGABUFF_FILTER_GROUP.CHAPTERS_COUNT:
          url.searchParams.append('chapters[]', filter.key);
          break;
      }
    }
  };

  let filtersPromise: Promise<RawFilterGroup[]> | null = null;

  const getFilters = (): Promise<RawFilterGroup[]> => {
    if (!filtersPromise) filtersPromise = fetchFilters();
    return filtersPromise;
  };

  const fetchFilters = async (): Promise<RawFilterGroup[]> => {
    const doc = await ctx.http.getHtml(`https://${domain}/manga`);
    const $ = doc.$;

    const groups: RawFilterGroup[] = [];
    const genres = parseSelectOptions($, 'genres[]');
    if (genres.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.GENRE,
        title: 'Жанры',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: genres,
      });
    }
    const types = parseSelectOptions($, 'type_id[]');
    if (types.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.TYPE,
        title: 'Тип',
        type: FILTER_TYPE.CHECKBOX_EXCLUDE,
        options: types,
      });
    }
    const tags = parseSelectOptions($, 'tags[]');
    if (tags.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.TAG,
        title: 'Теги',
        type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
        options: tags,
      });
    }
    const statuses = parseSelectOptions($, 'status_id[]');
    if (statuses.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.STATUS,
        title: 'Статус',
        type: FILTER_TYPE.CHECKBOX,
        options: statuses,
      });
    }
    const ageRatings = parseSelectOptions($, 'age_rating[]');
    if (ageRatings.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.AGE_RATING,
        title: 'Возрастное ограничение',
        type: FILTER_TYPE.CHECKBOX,
        options: ageRatings,
      });
    }
    const ratings = parseSelectOptions($, 'rating[]');
    if (ratings.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.RATING,
        title: 'Рейтинг',
        type: FILTER_TYPE.CHECKBOX,
        options: ratings,
      });
    }
    const years = parseSelectOptions($, 'year[]');
    if (years.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.YEAR,
        title: 'Год выпуска',
        type: FILTER_TYPE.CHECKBOX,
        options: years,
      });
    }
    const chaptersCount = parseChaptersCountOptions($);
    if (chaptersCount.length > 0) {
      groups.push({
        id: MANGABUFF_FILTER_GROUP.CHAPTERS_COUNT,
        title: 'Количество глав',
        type: FILTER_TYPE.CHECKBOX,
        options: chaptersCount,
      });
    }
    return groups;
  };

  const fetchCsrfToken = async (): Promise<string> => {
    if (csrfToken) return csrfToken;
    const doc = await ctx.http.getHtml(`https://${domain}/`);
    const token = attrOrNull(doc.$('head meta[name*=csrf-token]').first(), 'content');
    if (!token) throw new ParseError(`Unable to find CSRF token: https://${domain}/`, SOURCE_ID);
    csrfToken = token;
    return token;
  };

  const loadMoreChapterElements = async (mangaId: string): Promise<AnyNode[]> => {
    const post = async (): Promise<AnyNode[]> => {
      const token = await fetchCsrfToken();
      const res = await ctx.http.request({
        method: 'POST',
        url: `https://${domain}/chapters/load`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token,
        },
        body: new URLSearchParams({ manga_id: mangaId }),
      });
      if (res.status === 419) {
        csrfToken = null;
        throw new SourceUnavailableError(
          `CSRF token expired: https://${domain}/chapters/load`,
          SOURCE_ID,
        );
      }
      if (res.status >= 400) {
        throw new SourceUnavailableError(
          `Upstream HTTP ${res.status}: https://${domain}/chapters/load`,
          SOURCE_ID,
        );
      }
      const json = res.json<{ content?: string }>();
      const fragment = parseHtml(json.content ?? '', `https://${domain}/`);
      return fragment.$(CHAPTER_SELECTOR).toArray();
    };
    try {
      return await post();
    } catch (err) {
      if (csrfToken === null && err instanceof SourceUnavailableError) {
        return post();
      }
      throw err;
    }
  };

  const parseChapterElement = (el: AnyNode, $: CheerioAPI, index: number): RawChapter | null => {
    const $a = $(el);
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw) return null;
    const relUrl = toRelativeUrl(toAbsoluteUrl(hrefRaw, domain), domain);
    // Том, номер и название — три соседних блока («Том 35», «Глава 284», название). Читать их
    // одной строкой нельзя: первым числом в ней окажется номер тома, а название склеится с
    // «Том 35Глава 284».
    const volumeText = textOrNull($a.find('.chapters__volume'));
    const valueText = textOrNull($a.find('.chapters__value'));
    const nameText = textOrNull($a.find('.chapters__name'));
    const numberText = valueText ?? (volumeText || nameText ? null : textOrNull($a));
    const numberMatch = numberText ? CHAPTER_NUMBER_REGEX.exec(numberText) : null;
    const volumeMatch = volumeText ? CHAPTER_NUMBER_REGEX.exec(volumeText) : null;
    const chapterNumber = numberMatch ? parseFloatOrNull(numberMatch[0]) : null;
    return {
      id: generateUid(SOURCE_ID, relUrl),
      title: nullIfEmpty(nameText ?? valueText ?? numberText ?? ''),
      number: chapterNumber ?? index + 1,
      volume: volumeMatch ? parseFloatOrNull(volumeMatch[0]) : null,
      url: relUrl,
      scanlator: null,
      uploadDate: parseDdMmYyyy(textOrNull($a.find('.chapters__add-date').first())),
      branch: null,
      source: SOURCE_ID,
    };
  };

  const collectTags = ($: CheerioAPI): RawTag[] => {
    // .tags also carries the age-rating badge (.tags__item--warning) — that's contentRating, not
    // a genre/tag, so it's excluded here and read separately in getDetails.
    const elements = $('.tags > .tags__item:not(.tags__item--warning)').toArray();
    const seen = new Set<string>();
    const tags: RawTag[] = [];
    for (const el of elements) {
      const $a = $(el);
      const title = (textOrNull($a) ?? '').trim();
      if (!title) continue;
      const hrefKey = (attrOrNull($a, 'href') ?? '').replace(/\/$/, '').split('/').pop();
      const key = hrefKey && hrefKey.length > 0 ? hrefKey : slugifyTitle(title);
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push({ title, key, source: SOURCE_ID });
    }
    return tags;
  };

  const getDetails = async (mangaUrl: string): Promise<RawTitle> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const $ = doc.$;

    let chapterEls: AnyNode[] = $(CHAPTER_SELECTOR).toArray();
    if ($('.load-chapters-trigger').length > 0) {
      const mangaId = attrOrNull($('.manga').first(), 'data-id');
      if (mangaId) {
        chapterEls = [...chapterEls, ...(await loadMoreChapterElements(mangaId))];
      }
    }
    const reversed = chapterEls.slice().reverse();
    const chapters = reversed
      .map((el, i) => parseChapterElement(el, $, i))
      .filter((c): c is RawChapter => c !== null);

    const { type, year, stateText } = parseMiddleLinks($);
    const altTitles = $('.manga__name-alt > span, .manga-mobile__name-alt > span')
      .toArray()
      .map((el) => textOrNull($(el)))
      .filter((t): t is string => !!t && t.trim().length > 0);

    const ratingRaw = textOrNull($('.manga__rating').first());
    const ratingPct = ratingRaw ? parseFloatOrNull(ratingRaw.replace(',', '.')) : null;
    const contentRating = contentRatingByLabel(textOrNull($('.tags__item--warning').first()));

    // itemprop=ratingCount is the vote count behind `rating`, distinct from `.manga__views`
    // (read counter) and `data-fav-count` (bookmarks) below.
    const votesCount = parseIntOrNull(
      attrOrNull($('meta[itemprop=ratingCount]').first(), 'content'),
    );
    const views = parseIntOrNull(
      textOrNull($('.manga__views').first())?.replace(/\s/g, '') ?? null,
    );
    const likes = parseIntOrNull(attrOrNull($('.manga').first(), 'data-fav-count'));

    const title =
      nullIfEmpty(textOrNull($('h1, .manga__name, .manga-mobile__name').first())) ??
      mangaUrl.replace(/\/$/, '').split('/').pop() ??
      mangaUrl;
    const $cover = $('.manga__img img, img.manga-mobile__image').first();
    const coverUrl = attrOrNull($cover, 'src') ? absUrl($cover, 'src', doc.baseUrl) : null;

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title,
      altTitles,
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: ratingPct !== null ? ratingPct / 10 : RATING_UNKNOWN,
      contentRating,
      coverUrl,
      largeCoverUrl: null,
      tags: collectTags($),
      releaseState: stateText ? parseStatus(stateText) : null,
      authors: [],
      description: nullIfEmpty(textOrNull($('.manga__description').first())),
      chapters,
      source: SOURCE_ID,
      type,
      year,
      votesCount,
      views,
      likes,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const absoluteUrl = toAbsoluteUrl(chapterUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    return doc
      .$('.reader__pages img')
      .toArray()
      .map((el): RawPage | null => {
        const $img = doc.$(el);
        const raw = attrOrNull($img, 'data-src') ?? attrOrNull($img, 'src');
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
      title: 'MangaBuff',
      domain,
      locale: SOURCE_LOCALE.RU,
      contentType: SOURCE_CONTENT_TYPE.MANGA,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [SORT_ORDER.POPULARITY, SORT_ORDER.UPDATED, SORT_ORDER.RATING, SORT_ORDER.ADDED],
      supportsDirection: false,
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

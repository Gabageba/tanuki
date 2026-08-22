import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { RAW_MANGA_STATE } from '../../types';
import { CONTENT_RATING, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawManga, RawChapter, RawPage, RawTag, RawMangaState } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { parseHtml } from '../../core/html/dom';
import { attrOrNull, textOrNull, selectFirstOrThrow } from '../../core/html/selectors';
import { parseRuRelativeDate } from '../../core/text/dates';
import { parseIntOrNull, parseFloatOrNull } from '../../core/text/numbers';
import { toTitleCase, nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { UserAgents } from '../../core/http/user-agents';

const SOURCE_ID = 'DESUME';
const PAGE_SIZE = 24;
const IMAGE_REFERER = 'https://x.desu.city/';

const CHAPTER_ID_REGEX = /\.(\d+)\/?$/;
const CHAPTER_PATH_REGEX = /\/vol(\d+)\/ch([0-9.]+)\//;
const READER_DIR_REGEX = /dir:\s*"([^"]*)"/;
const READER_PREFIX_REGEX = /prefix:\s*"([^"]*)"/;
const READER_IMAGE_REGEX = /\[\s*"([^"]+)"\s*,\s*\d+\s*,\s*\d+\s*]/g;
const CSS_URL_REGEX = /url\((['"]?)([^'")]+)\1\)/;

const toRelativePath = (href: string): string => {
  return href.startsWith('/') ? href : `/${href}`;
};

const extractCssUrl = (css: string): string | null => {
  return CSS_URL_REGEX.exec(css)?.[2] ?? null;
};

const toLargeCoverUrl = (coverUrl: string): string => {
  return coverUrl.replace(/\/(preview|snippet|x120)\//, '/original/');
};

const mangaStateByClass = (cls: string | null): RawMangaState | null => {
  if (cls === 'ongoing') return RAW_MANGA_STATE.ONGOING;
  if (cls === 'released' || cls === 'completed') return RAW_MANGA_STATE.FINISHED;
  return null;
};

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case 'ALPHABETICAL':
      return 'name';
    case 'POPULARITY':
      return 'popular';
    case 'NEWEST':
      return 'id';
    default:
      return 'updated';
  }
};

/** dl.pairsInline label/value pairs, e.g. "Жанры:" / "Рейтинг:" on catalog cards. */
const pairValue = ($li: Cheerio<AnyNode>, label: string): string | null => {
  const pairs = $li.find('dl.pairsInline').toArray();
  for (const el of pairs) {
    const $pair = $li.find(el);
    if (textOrNull($pair.find('dt').first()) === label) {
      return textOrNull($pair.find('dd').first());
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
  ): RawManga | null => {
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
      state: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  /** Quick-search results carry only cover + two title variants — getDetails fills the rest. */
  const parseSearchItem = ($li: Cheerio<AnyNode>, baseUrl: string): RawManga | null => {
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
      state: null,
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
    const volume = match ? (parseIntOrNull(match[1]!) ?? 0) : 0;
    const number = match ? (parseFloatOrNull(match[2]!) ?? 0) : 0;
    const date = textOrNull($li.find('span.date').first());
    return {
      id: chapterId,
      source: SOURCE_ID,
      url,
      uploadDate: parseRuRelativeDate(date),
      title: nullIfEmpty(textOrNull($a) ?? ''),
      volume,
      number,
      scanlator: null,
      branch: null,
    };
  };

  const search = async (query: string): Promise<RawManga[]> => {
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
      .filter((m): m is RawManga => m !== null);
  };

  const fetchCatalogPage = async (page: number, order: string | undefined): Promise<RawManga[]> => {
    const url = new URL(`https://${domain}/manga/`);
    const orderBy = getSortKey(order);
    if (orderBy !== 'updated') url.searchParams.set('order_by', orderBy);
    if (page > 1) url.searchParams.set('page', String(page));
    const [doc, tagsMap] = await Promise.all([ctx.http.getHtml(url.toString()), getTagsMap()]);
    return doc
      .$('li.memberListItem')
      .toArray()
      .map((el) => parseMangaItem(doc.$(el), doc.baseUrl, tagsMap))
      .filter((m): m is RawManga => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, async (page) => {
      if (params.query) {
        return page === 1 ? search(params.query!) : [];
      }
      return fetchCatalogPage(page, params.order);
    });
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = new URL(mangaUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const root = doc.$.root();

    const originalTitle = nullIfEmpty(textOrNull(doc.$('h1 .name').first()) ?? '');
    const russianTitle = nullIfEmpty(textOrNull(doc.$('h1 .rus-name').first()) ?? '');
    const altTitles = (textOrNull(doc.$('.alternativeHeadline').first()) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (originalTitle && originalTitle !== russianTitle) altTitles.push(originalTitle);

    const tags = doc
      .$('.c-info-left .tagList a[itemprop=genre]')
      .toArray()
      .map((el) => parseTagFromLink(doc.$(el)))
      .filter((t): t is RawTag => t !== null);

    const statusValue = detailValue(root, 'Статус:');
    const statusEl = statusValue?.find('.b-anime_status_tag').first();
    const statusClass = statusEl
      ? (statusEl
          .attr('class')
          ?.split(/\s+/)
          .find((c) => c !== 'b-anime_status_tag') ?? null)
      : null;

    const ratingRaw = attrOrNull(doc.$('.b-rate').first(), 'data-score');
    const ratingValue = parseFloatOrNull(ratingRaw);

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
      state: mangaStateByClass(statusClass),
      authors: [],
      description,
      chapters,
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const absoluteUrl = new URL(chapterUrl, `https://${domain}/`).toString();
    const doc = await ctx.http.getHtml(absoluteUrl);
    const script = doc
      .$('script')
      .toArray()
      .map((el) => doc.$(el).html() ?? '')
      .find((s) => s.includes('Reader.init'));
    if (!script) throw new ParseError('Reader script not found', SOURCE_ID);

    const dir = READER_DIR_REGEX.exec(script)?.[1];
    if (dir === undefined) throw new ParseError('Invalid reader response', SOURCE_ID);
    const prefix = READER_PREFIX_REGEX.exec(script)?.[1] ?? '';
    const baseUrl = dir.startsWith('http') ? dir : `https:${dir}`;

    const images = [...script.matchAll(READER_IMAGE_REGEX)].map((m) => m[1]!);
    if (images.length === 0) throw new ParseError('No pages found', SOURCE_ID);

    return images.map((file) => {
      const pageUrl = baseUrl + prefix + file;
      return {
        id: generateUid(SOURCE_ID, pageUrl),
        url: pageUrl,
        preview: null,
        source: SOURCE_ID,
      };
    });
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Desu',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: false,
      sortOrders: ['UPDATED', 'POPULARITY', 'NEWEST', 'ALPHABETICAL'],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: IMAGE_REFERER, 'User-Agent': UserAgents.KOTATSU }),
  };
};

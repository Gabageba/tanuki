import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { CONTENT_RATING, SORT_ORDER, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawManga, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { parseGroupleDate } from '../../core/text/dates';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.SEXKOMIX2;
/**
 * The real catalog `<ul>` has 24 `li.comix` slots per /home and /search page, but one of them
 * is always an ad placeholder (`div.opt[data-asg-ins]`, no `<a>`) that parseMangaTile filters
 * out — verified constant across 6 live pages. 23, not 24, is what fetchListPage actually
 * returns per page, and fetchPaged's "short page = end of catalog" check needs that real count
 * or every page falsely looks like the last one.
 */
const PAGE_SIZE = 23;

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.POPULARITY:
      return 'prosmotr';
    case SORT_ORDER.RATING:
      return 'like';
    default:
      return 'date';
  }
};

/** Dedupes by the tag's own `tag_pagex` slug — the same tag can appear on multiple `<a>`s. */
const parseTagLinks = ($links: Cheerio<AnyNode>, $: CheerioAPI): RawTag[] => {
  const seen = new Set<string>();
  const tags: RawTag[] = [];
  $links.toArray().forEach((el) => {
    const $a = $(el);
    const title = textOrNull($a);
    if (!title) return;
    const href = attrOrNull($a, 'href') ?? '';
    const key = new URL(href, 'https://x/').searchParams.get('t') ?? title;
    if (seen.has(key)) return;
    seen.add(key);
    tags.push({ title, key, source: SOURCE_ID });
  });
  return tags;
};

/**
 * The page markup has *three* `<ul id="comix_directory">` (duplicate, non-unique ids): a VIP
 * promo carousel, the real paginated catalog, and a "more comics" widget nested inside
 * `#more_comics_directory`. Only the middle one tracks `sort=`/`page=` — the other two are
 * fixed extras that would corrupt both item counts and pagination if scraped. It's first on
 * /search (no promo carousel there) and second on /home, but always the last one not nested
 * in `#more_comics_directory`.
 */
const findCatalogList = ($: CheerioAPI): Cheerio<AnyNode> => {
  return $('ul#comix_directory')
    .filter((_, el) => $(el).parents('#more_comics_directory').length === 0)
    .last();
};

export const createSexKomix2Parser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  const parseMangaTile = (
    $item: Cheerio<AnyNode>,
    $: CheerioAPI,
    baseUrl: string,
  ): RawManga | null => {
    const $a = $item.find('a').first();
    if ($a.length === 0) return null;
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const title =
      textOrNull($item.find('.comix_title').first())?.replace('Порно комикс ', '') ?? '';
    const $img = $item.find('img.comix_img').first();
    const coverUrl = attrOrNull($img, 'data-src') ? absUrl($img, 'data-src', baseUrl) : null;

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: [],
      url: relUrl,
      publicUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl,
      tags: parseTagLinks($item.find('ul.tags_ul a'), $),
      state: null,
      authors: [],
      largeCoverUrl: null,
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<RawManga[]> => {
    const sort = getSortKey(order);
    const path = query
      ? `/search/?lang=ru&q=${encodeURIComponent(query)}&sort=${sort}&page=${page}`
      : `/home/?lang=ru&only=&sort=${sort}&page=${page}`;
    const doc = await ctx.http.getHtml(toAbsoluteUrl(path, domain));
    return findCatalogList(doc.$)
      .find('li.comix')
      .toArray()
      .map((el) => parseMangaTile(doc.$(el), doc.$, doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.query),
    );
  };

  /** "Студия:" / "Переводчик:" are two `.studio_translator_box` blocks; value is the sibling link's text. */
  const findStudioTranslatorValue = ($: CheerioAPI, label: string): string | null => {
    const $label = $('.studio_translator')
      .toArray()
      .map((el) => $(el))
      .find((el) => (textOrNull(el) ?? '').includes(label));
    if (!$label) return null;
    return nullIfEmpty(textOrNull($label.siblings('.link_button').find('a').first()));
  };

  const findDescriptionHtml = ($: CheerioAPI): string | null => {
    const $box = $('#comix_description .info_box')
      .toArray()
      .map((el) => $(el))
      .find((el) => (textOrNull(el) ?? '').startsWith('Описание'));
    return $box ? $box.find('p').first().html() : null;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);

    const title = textOrNull(doc.$('#comix_description h1').first()) ?? mangaUrl;
    const $cover = doc.$('#comix_cover_img').first();
    const largeCoverUrl = attrOrNull($cover, 'data-src')
      ? absUrl($cover, 'data-src', doc.baseUrl)
      : null;
    const author = findStudioTranslatorValue(doc.$, 'Студия');
    const scanlator = findStudioTranslatorValue(doc.$, 'Переводчик');
    const uploadDate = parseGroupleDate(
      textOrNull(doc.$('li[title="Дата публикации комикса"] .cifra-info-set').first()),
    );
    const tags = parseTagLinks(doc.$('#comix_description a[href*="tag_pagex"]'), doc.$);

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title,
      altTitles: [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: null,
      largeCoverUrl,
      tags,
      state: null,
      authors: author ? [author] : [],
      description: findDescriptionHtml(doc.$),
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
    const seen = new Set<string>();
    const pages: RawPage[] = [];
    doc.$('#comix_pages_ul img[data-src]').each((_, el) => {
      const raw = attrOrNull(doc.$(el), 'data-src');
      if (!raw) return;
      const url = toAbsoluteUrl(raw, domain);
      if (seen.has(url)) return;
      seen.add(url);
      pages.push({ id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID });
    });
    if (pages.length === 0) throw new ParseError('No pages found', SOURCE_ID);
    return pages;
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'SexKomix2',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.COMICS,
      isBroken: false,
      isAdult: true,
      requiresVpn: false,
      sortOrders: [SORT_ORDER.NEWEST, SORT_ORDER.POPULARITY, SORT_ORDER.RATING],
      supportsDirection: false,
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

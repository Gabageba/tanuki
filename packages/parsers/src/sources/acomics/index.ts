import { SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawManga, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { nullIfEmpty } from '../../core/text/strings';
import { ParseError } from '../../errors';

const SOURCE_ID = 'ACOMICS';
const PAGE_SIZE = 10;
const FIRST_PAGE = 0;

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case 'ALPHABETICAL':
      return 'serial_name';
    case 'POPULARITY':
      return 'subscr_count';
    default:
      return 'last_update';
  }
};

export const createAComicsParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let tagsPromise: Promise<Map<string, RawTag>> | null = null;

  void ctx.jar.setCookie(`ageRestrict=18; Domain=${domain}; Path=/`, `https://${domain}/`);

  const getTagMap = (): Promise<Map<string, RawTag>> => {
    tagsPromise ??= fetchTagMap();
    return tagsPromise;
  };

  const fetchTagMap = async (): Promise<Map<string, RawTag>> => {
    const doc = await ctx.http.getHtml(`https://${domain}/comics`);
    const map = new Map<string, RawTag>();
    doc
      .$('#catalog a.button')
      .toArray()
      .forEach((el) => {
        const $a = doc.$(el);
        const html = $a.html() ?? '';
        const name = html.split('</span>').pop()?.trim() ?? '';
        if (!name) return;
        const onclick = attrOrNull($a, 'onclick') ?? '';
        const key = onclick.split("('").pop()?.split("')")[0] ?? name;
        map.set(name, { title: name, key, source: SOURCE_ID });
      });
    return map;
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<RawManga[]> => {
    let url: string;
    if (query) {
      if (page > 0) return [];
      url = `https://${domain}/search?keyword=${encodeURIComponent(query)}`;
    } else {
      url =
        `https://${domain}/comics?ratings[]=1&ratings[]=2&ratings[]=3&ratings[]=4&ratings[]=5&ratings[]=6` +
        `&skip=${page * PAGE_SIZE}&sort=${getSortKey(order)}`;
    }
    const doc = await ctx.http.getHtml(url);
    return doc
      .$('table.list-loadable')
      .toArray()
      .map((el): RawManga | null => {
        const $row = doc.$(el);
        const $a = $row.find('a').first();
        const hrefRaw = attrOrNull($a, 'href');
        if (!hrefRaw) return null;
        const publicUrl = `${toAbsoluteUrl(hrefRaw, domain)}/about`;
        const relUrl = toRelativeUrl(publicUrl, domain);
        const title = textOrNull($row.find('.title').first()) ?? relUrl;
        const $img = $row.find('img').first();
        const coverUrl = attrOrNull($img, 'src') ? absUrl($img, 'src', doc.baseUrl) : null;

        return {
          id: generateUid(SOURCE_ID, relUrl),
          title,
          altTitles: [],
          url: relUrl,
          publicUrl,
          rating: RATING_UNKNOWN,
          contentRating: null,
          coverUrl,
          tags: [],
          state: null,
          authors: [],
          largeCoverUrl: null,
          description: null,
          chapters: null,
          source: SOURCE_ID,
        };
      })
      .filter((m): m is RawManga => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: FIRST_PAGE }, (page) =>
      fetchListPage(page, params.order, params.query),
    );
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const tagMap = await getTagMap();

    const tags = doc
      .$('p.serial-about-badges .category')
      .toArray()
      .map((el) => tagMap.get(textOrNull(doc.$(el)) ?? ''))
      .filter((t): t is RawTag => t !== undefined);

    const authorP = doc
      .$('p')
      .toArray()
      .map((el) => doc.$(el))
      .find((el) => (textOrNull(el) ?? '').includes('Автор оригинала:'));
    const author = authorP
      ? nullIfEmpty((textOrNull(authorP) ?? '').replace('Автор оригинала:', '').trim())
      : null;

    const title = textOrNull(doc.$('.title').first()) ?? mangaUrl;
    const description = nullIfEmpty(textOrNull(doc.$('section.serial-about-text p').first()));
    const chapterUrl = mangaUrl.replace('/about', '/');

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title,
      altTitles: [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      contentRating: null,
      coverUrl: null,
      largeCoverUrl: null,
      tags,
      state: null,
      authors: author ? [author] : [],
      description,
      chapters: [
        {
          id: generateUid(SOURCE_ID, mangaUrl),
          title,
          number: 1,
          volume: 0,
          url: chapterUrl,
          scanlator: null,
          uploadDate: 0,
          branch: null,
          source: SOURCE_ID,
        },
      ],
      source: SOURCE_ID,
    };
  };

  /**
   * Unlike the fork (which resolves each page's image lazily via a separate `getPageUrl`
   * step), this package's `RawPage.url` must already be absolute and pre-resolved — so every
   * page's own HTML has to be fetched up front here instead of on demand.
   */
  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const base = toAbsoluteUrl(chapterUrl, domain);
    const firstDoc = await ctx.http.getHtml(`${base}1`);
    const counterText = textOrNull(firstDoc.$('span.issueNumber').first());
    const total = Number.parseInt(counterText?.split('/').pop() ?? '', 10);
    if (!Number.isFinite(total) || total <= 0) {
      throw new ParseError('Cannot parse issue count', SOURCE_ID);
    }

    const pages: RawPage[] = [];
    for (let i = 1; i <= total; i += 1) {
      const pageUrl = `${base}${i}`;
      const doc = i === 1 ? firstDoc : await ctx.http.getHtml(pageUrl);
      const src = attrOrNull(doc.$('#mainImage').first(), 'src');
      if (!src) continue;
      const url = toAbsoluteUrl(src, domain);
      pages.push({ id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID });
    }
    return pages;
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'AComics',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.comics,
      isBroken: true,
      isAdult: false,
      sortOrders: ['UPDATED', 'ALPHABETICAL', 'POPULARITY'],
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

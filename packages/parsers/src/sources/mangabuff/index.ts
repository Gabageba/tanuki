import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { RAW_MANGA_STATE } from '../../types';
import { SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawManga, RawChapter, RawPage, RawTag, RawMangaState } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { parseHtml } from '../../core/html/dom';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { parseFloatOrNull } from '../../core/text/numbers';
import { nullIfEmpty } from '../../core/text/strings';
import { parseDdMmYyyy } from '../../core/text/dates';
import { ParseError, SourceUnavailableError } from '../../errors';

const SOURCE_ID = 'MANGABUFF';
const PAGE_SIZE = 24;
const CHAPTER_SELECTOR = 'a.chapters__item';
const CHAPTER_NUMBER_REGEX = /\d+(?:[.,]\d+)?/;

const getSortKey = (order: string | undefined): string => {
  return order === 'POPULARITY' ? 'real_views' : 'updated_at';
};

const parseStatus = (value: string): RawMangaState | null => {
  switch (value.toLowerCase().trim()) {
    case 'завершен':
      return RAW_MANGA_STATE.FINISHED;
    case 'продолжается':
      return RAW_MANGA_STATE.ONGOING;
    case 'заморожен':
      return RAW_MANGA_STATE.PAUSED;
    case 'заброшен':
      return RAW_MANGA_STATE.ABANDONED;
    default:
      return null;
  }
};

export const createMangaBuffParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let csrfToken: string | null = null;

  const parseMangaCard = ($item: Cheerio<AnyNode>, baseUrl: string): RawManga | null => {
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
  };

  const parseMangaList = (doc: { $: CheerioAPI; baseUrl: string }): RawManga[] => {
    return doc
      .$('.cards .cards__item')
      .toArray()
      .map((el) => parseMangaCard(doc.$(el), doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<RawManga[]> => {
    const url = new URL(query ? `https://${domain}/search` : `https://${domain}/manga`);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.set('sort', getSortKey(order));
    }
    if (page !== 1) url.searchParams.set('page', String(page));

    const doc = await ctx.http.getHtml(url.toString());
    return parseMangaList(doc);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.query),
    );
  };

  const fetchCsrfToken = async (): Promise<string> => {
    if (csrfToken) return csrfToken;
    const doc = await ctx.http.getHtml(`https://${domain}/`);
    const token = attrOrNull(doc.$('head meta[name*=csrf-token]').first(), 'content');
    if (!token) throw new ParseError('Unable to find CSRF token', SOURCE_ID);
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
        throw new SourceUnavailableError('CSRF token expired', SOURCE_ID);
      }
      if (res.status >= 400) {
        throw new SourceUnavailableError(`Upstream HTTP ${res.status}`, SOURCE_ID);
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
    const specificText = textOrNull(
      $a.find('.chapters__volume, .chapters__value, .chapters__name'),
    );
    const title = specificText ?? textOrNull($a) ?? '';
    const numberMatch = CHAPTER_NUMBER_REGEX.exec(title);
    const chapterNumber = numberMatch ? parseFloatOrNull(numberMatch[0].replace(',', '.')) : null;
    return {
      id: generateUid(SOURCE_ID, relUrl),
      title: nullIfEmpty(title),
      number: chapterNumber ?? index + 1,
      volume: 0,
      url: relUrl,
      scanlator: null,
      uploadDate: parseDdMmYyyy(textOrNull($a.find('.chapters__add-date').first())),
      branch: null,
      source: SOURCE_ID,
    };
  };

  const collectTags = ($: CheerioAPI): RawTag[] => {
    const elements = $(
      '.manga__middle-links > a:not(:last-child), .manga-mobile__info > a:not(:last-child), .tags > .tags__item',
    ).toArray();
    const seen = new Set<string>();
    const tags: RawTag[] = [];
    for (const el of elements) {
      const $a = $(el);
      const title = (textOrNull($a) ?? '').trim();
      if (!title) continue;
      const hrefKey = (attrOrNull($a, 'href') ?? '').replace(/\/$/, '').split('/').pop();
      const key =
        hrefKey && hrefKey.length > 0
          ? hrefKey
          : title
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, '-')
              .replace(/^-+|-+$/g, '');
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push({ title, key, source: SOURCE_ID });
    }
    return tags;
  };

  const buildDetailsDescription = ($: CheerioAPI): string => {
    const lines: string[] = [];
    const desc = nullIfEmpty(textOrNull($('.manga__description').first()));
    if (desc) lines.push(desc);

    const ratingRaw = textOrNull($('.manga__rating').first());
    const ratingPct = ratingRaw ? parseFloatOrNull(ratingRaw.replace(',', '.')) : null;
    if (ratingPct !== null) lines.push(`Рейтинг: ${Math.round(ratingPct * 10)}%`);

    const viewsRaw = textOrNull($('.manga__views').first())?.replace(/\s/g, '');
    const views = viewsRaw ? Number.parseInt(viewsRaw, 10) : NaN;
    if (!Number.isNaN(views)) lines.push(`Просмотров: ${views.toLocaleString('ru-RU')}`);

    const favRaw = attrOrNull($('.manga').first(), 'data-fav-count');
    const fav = favRaw ? Number.parseInt(favRaw, 10) : NaN;
    if (!Number.isNaN(fav)) lines.push(`Избранное: ${fav.toLocaleString('ru-RU')}`);

    const altTitles = $('.manga__name-alt > span, .manga-mobile__name-alt > span')
      .toArray()
      .map((el) => textOrNull($(el)))
      .filter((t): t is string => !!t && t.trim().length > 0);
    if (altTitles.length > 0) {
      lines.push('Альтернативные названия:');
      lines.push(...altTitles.map((t) => `• ${t}`));
    }
    return lines.join('\n\n');
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
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

    const stateText = textOrNull(
      $('.manga__middle-links > a:last-child, .manga-mobile__info > a:last-child').first(),
    );
    const altTitles = $('.manga__name-alt > span, .manga-mobile__name-alt > span')
      .toArray()
      .map((el) => textOrNull($(el)))
      .filter((t): t is string => !!t && t.trim().length > 0);

    const ratingRaw = textOrNull($('.manga__rating').first());
    const ratingPct = ratingRaw ? parseFloatOrNull(ratingRaw.replace(',', '.')) : null;

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
      contentRating: null,
      coverUrl,
      largeCoverUrl: null,
      tags: collectTags($),
      state: stateText ? parseStatus(stateText) : null,
      authors: [],
      description: nullIfEmpty(buildDetailsDescription($)),
      chapters,
      source: SOURCE_ID,
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
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: false,
      sortOrders: ['UPDATED', 'POPULARITY'],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

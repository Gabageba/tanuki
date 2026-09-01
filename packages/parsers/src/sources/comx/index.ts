import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { MANGA_STATE, SORT_ORDER, SOURCE_CONTENT_TYPE, type MangaState } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { Doc } from '../../core/html/dom';
import type { RawManga, RawChapter, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import { attrOrNull, textOrNull, absUrl } from '../../core/html/selectors';
import { parseDdMmYyyy } from '../../core/text/dates';
import { nullIfEmpty, toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';

const SOURCE_ID = 'COMX';
const PAGE_SIZE = 20;
const CDN_IMAGE_HOST = 'img.com-x.life/comix/';

type ChapterJson = {
  id: number;
  posi?: number;
  title?: string | null;
  date?: string | null;
  volume?: number;
};

type DataJson = {
  chapters: ChapterJson[];
  news_id: number;
};

/** "AltTitle / MainTitle" — the primary title is the second slash-separated part, per the fork. */
const splitTitle = (raw: string): { title: string; altTitle: string | null } => {
  const parts = raw
    .split(/\s*\/\s*/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length >= 2) return { title: parts[1]!, altTitle: parts[0]! };
  if (parts.length === 1) return { title: parts[0]!, altTitle: null };
  return { title: raw, altTitle: null };
};

/** Decodes `\uXXXX` escapes that survive JSON parsing embedded as literal text in the page. */
const decodeUnicodeEscapes = (text: string | null | undefined): string | null => {
  if (text == null) return null;
  try {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
  } catch {
    return text;
  }
};

const extractScript = (doc: Doc, marker: string): string | null => {
  return (
    doc
      .$('script')
      .toArray()
      .map((el) => doc.$(el).html() ?? '')
      .find((s) => s.includes(marker)) ?? null
  );
};

export const createComxParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let tagsPromise: Promise<RawTag[]> | null = null;

  // The site gates its catalog behind an age-confirmation cookie — set once up front rather
  // than on every request, matching the fork's constructor-time `insertCookies` call.
  void ctx.jar.setCookie(`adt-accepted=1; Domain=${domain}; Path=/`, `https://${domain}/`);

  const getTags = (): Promise<RawTag[]> => {
    tagsPromise ??= fetchTags();
    return tagsPromise;
  };

  const fetchTags = async (): Promise<RawTag[]> => {
    const doc = await ctx.http.getHtml(`https://${domain}/comix/`);
    const scriptText = extractScript(doc, '__XFILTER__');
    if (!scriptText) return [];
    const afterMarker = scriptText.split('"g":{')[1];
    if (!afterMarker) return [];
    const genresJson = `{${afterMarker.split('}}}')[0]}}`;
    let parsed: { values?: { id: number; value: string }[] };
    try {
      parsed = JSON.parse(genresJson) as { values?: { id: number; value: string }[] };
    } catch {
      return [];
    }
    return (parsed.values ?? []).map((g) => ({
      key: String(g.id),
      title: toTitleCase(g.value),
      source: SOURCE_ID,
    }));
  };

  const parseMangaTile = ($item: Cheerio<AnyNode>, baseUrl: string): RawManga | null => {
    const $a = $item.find('a.readed__img').first();
    if ($a.length === 0) return null;
    const hrefRaw = attrOrNull($a, 'href');
    if (!hrefRaw) return null;
    const publicUrl = toAbsoluteUrl(hrefRaw, domain);
    const relUrl = toRelativeUrl(publicUrl, domain);
    const titleText = textOrNull($item.find('h3.readed__title a').first()) ?? '';
    const { title, altTitle } = splitTitle(titleText);
    const $img = $item.find('img[data-src]').first();
    const coverUrl = attrOrNull($img, 'data-src') ? absUrl($img, 'data-src', baseUrl) : null;

    return {
      id: generateUid(SOURCE_ID, relUrl),
      title,
      altTitles: altTitle ? [altTitle] : [],
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

  const fetchListPage = async (page: number, query: string | undefined): Promise<RawManga[]> => {
    let path: string;
    if (query) {
      const encoded = query
        .split(/\s+/)
        .filter((p) => p.length > 0)
        .map((p) => encodeURIComponent(p))
        .join('%20');
      path = `/search/${encoded}`;
      if (page > 1) path += `/page/${page}/`;
    } else {
      path = '/ComicList/sort';
      if (page > 1) path += `/page/${page}/`;
    }
    const doc = await ctx.http.getHtml(toAbsoluteUrl(path, domain));
    return doc
      .$('div.readed.d-flex.short')
      .toArray()
      .map((el) => parseMangaTile(doc.$(el), doc.baseUrl))
      .filter((m): m is RawManga => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.query),
    );
  };

  const findLiValueAfter = ($: CheerioAPI, label: string): string | null => {
    const $li = $('li')
      .toArray()
      .map((el) => $(el))
      .find((el) => (textOrNull(el) ?? '').includes(label));
    if (!$li) return null;
    return (textOrNull($li) ?? '').split(label)[1]?.trim() ?? null;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const absoluteUrl = toAbsoluteUrl(mangaUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const scriptText = extractScript(doc, '__DATA__');
    if (!scriptText) throw new ParseError('Script data not found', SOURCE_ID);
    const jsonText = scriptText.split('window.__DATA__ = ')[1]?.trim().replace(/;\s*$/, '');
    if (!jsonText) throw new ParseError('Script data not found', SOURCE_ID);
    let data: DataJson;
    try {
      data = JSON.parse(jsonText) as DataJson;
    } catch {
      throw new ParseError('Invalid script data', SOURCE_ID);
    }

    const chapters: RawChapter[] = data.chapters
      .map((c): RawChapter => ({
        id: generateUid(SOURCE_ID, `${data.news_id}/${c.id}`),
        url: `/reader/${data.news_id}/${c.id}`,
        number: c.posi ?? 0,
        title: decodeUnicodeEscapes(c.title),
        uploadDate: parseDdMmYyyy(c.date),
        source: SOURCE_ID,
        scanlator: null,
        branch: null,
        volume: c.volume ?? 0,
      }))
      .reverse();

    const author = nullIfEmpty(findLiValueAfter(doc.$, 'Publisher:'));
    const releaseType = findLiValueAfter(doc.$, 'Release type:');
    const state: MangaState =
      releaseType === 'Ongoing' ? MANGA_STATE.ONGOING : MANGA_STATE.FINISHED;

    const tagLinks = doc
      .$('a[href*="/genres/"]')
      .toArray()
      .map((el) => textOrNull(doc.$(el)));
    let tags: RawTag[] = [];
    if (tagLinks.length > 0) {
      const allTags = await getTags();
      tags = tagLinks
        .map((name) => allTags.find((t) => t.title.toLowerCase() === (name ?? '').toLowerCase()))
        .filter((t): t is RawTag => t !== undefined);
    }

    const titleText = textOrNull(doc.$('h1').first()) ?? '';
    const { title, altTitle } = splitTitle(titleText);
    const $cover = doc.$('.page__poster img, .item__poster img, img[data-src]').first();
    const coverUrl = attrOrNull($cover, 'data-src')
      ? absUrl($cover, 'data-src', doc.baseUrl)
      : attrOrNull($cover, 'src')
        ? absUrl($cover, 'src', doc.baseUrl)
        : null;

    return {
      id: generateUid(SOURCE_ID, mangaUrl),
      title: title || mangaUrl,
      altTitles: altTitle ? [altTitle] : [],
      url: mangaUrl,
      publicUrl: absoluteUrl,
      rating: RATING_UNKNOWN,
      contentRating: null,
      coverUrl,
      largeCoverUrl: null,
      tags,
      state,
      authors: author ? [author] : [],
      description: nullIfEmpty(textOrNull(doc.$('div.page__text.full-text.clearfix').first())),
      chapters,
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const newsId = chapterUrl.split('/reader/')[1]?.split('/')[0];
    if (newsId) {
      await ctx.jar.setCookie(`adult=${newsId}; Domain=${domain}; Path=/`, `https://${domain}/`);
    }
    const absoluteUrl = toAbsoluteUrl(chapterUrl, domain);
    const doc = await ctx.http.getHtml(absoluteUrl);
    const scriptText = extractScript(doc, '__DATA__');
    if (!scriptText) throw new ParseError('Image data not found', SOURCE_ID);
    const afterImages = scriptText.split('"images":[')[1];
    if (!afterImages) throw new ParseError('Image data not found', SOURCE_ID);
    const imagesRaw = afterImages.split(']')[0] ?? '';
    const images = imagesRaw
      .split(',')
      .map((s) => s.trim().replace(/^"|"$/g, '').replace(/\\/g, ''))
      .filter((s) => s.length > 0);
    if (images.length === 0) throw new ParseError('Image data not found', SOURCE_ID);

    return images.map((imageUrl) => ({
      id: generateUid(SOURCE_ID, imageUrl),
      url: `https://${CDN_IMAGE_HOST}${imageUrl}`,
      preview: null,
      source: SOURCE_ID,
    }));
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Com-X',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.comics,
      // Site gates every request behind a JS PoW + TLS/JA3 fingerprint challenge (custom
      // "guard" appliance, not Cloudflare) — verified the /_v verification endpoint 404s
      // unconditionally for any non-real-browser TLS handshake, correct PoW answer or not.
      // Unfixable without a real headless-browser TLS stack; not worth the infra for one source.
      isBroken: true,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [SORT_ORDER.UPDATED],
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

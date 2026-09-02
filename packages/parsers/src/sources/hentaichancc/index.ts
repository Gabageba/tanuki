import { CONTENT_RATING, SORT_ORDER, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import type { RawManga, RawChapter, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toTitleCase } from '../../core/text/strings';
import { ParseError } from '../../errors';
import { SOURCE_ID as CATALOG_SOURCE_ID } from '../catalog';

const SOURCE_ID = CATALOG_SOURCE_ID.HENTAICHAN_CC;
/**
 * Not a domain the source config discovers dynamically — the site's Next.js frontend
 * (`ctx.domain`, used only for publicUrl/Referer) calls this Directus instance from the
 * browser, found via the frontend's `Content-Security-Policy: connect-src` header. It's a
 * fully public, unauthenticated API (no cf_clearance/API key needed, verified live) that
 * back-ends the whole catalog, unlike the Next.js pages themselves which only server-render
 * filter metadata, not the manga grid.
 */
const API_BASE = 'https://backend.hentaichan.cc';
/**
 * Not `${API_BASE}/assets/<uuid>` — that hits the Directus origin directly and measured
 * ~1.6-2s per image live (TTFB), vs ~0.7-1.1s and falling on repeat hits through this edge
 * (the same host the site's own frontend hotlinks images from, confirmed live). Needs the
 * file's extension, which `filename_disk` below supplies for free in the same query.
 */
const CDN_BASE = 'https://cdn.hentaichan.cc';
/** id and slug are both needed — id to query chapters/details, slug to rebuild publicUrl. */
const URL_DELIMITER = ',,';

type DirectusListResponse<T> = {
  data: T[];
};
type DirectusItemResponse<T> = {
  data: T | null;
};

type FileRef = {
  filename_disk: string | null;
};

type MangaListItem = {
  id: number;
  name: string;
  slug: string;
  cover: FileRef | null;
};

type TagRef = {
  tags_id: { name: string; slug: string } | null;
};
type AuthorRef = {
  authors_id: { name: string | null } | null;
};

type MangaDetail = {
  id: number;
  name: string;
  slug: string;
  cover: FileRef | null;
  description: string | null;
  russian_name: string | null;
  english_name: string | null;
  romaji_name: string | null;
  tags: TagRef[];
  authors: AuthorRef[];
};

type ChapterListItem = {
  id: number;
};
type ChapterPages = {
  pages: { directus_files_id: FileRef | null }[];
};

const assetUrl = (file: FileRef | null): string | null => {
  return file?.filename_disk ? `${CDN_BASE}/${file.filename_disk}` : null;
};

const sortFor = (order: string | undefined): string => {
  switch (order) {
    case SORT_ORDER.POPULARITY:
      return '-views';
    case SORT_ORDER.RATING:
      return '-likes';
    default:
      return '-date_created';
  }
};

export const createHentaichanCcParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  const directusGet = async <T>(path: string, params: Record<string, string>): Promise<T> => {
    const url = `${API_BASE}${path}?${new URLSearchParams(params).toString()}`;
    return ctx.http.getJson<T>(url);
  };

  const parseListItem = (item: MangaListItem): RawManga => {
    const cover = assetUrl(item.cover);
    return {
      id: generateUid(SOURCE_ID, item.id),
      title: item.name,
      altTitles: [],
      url: [item.id, item.slug].join(URL_DELIMITER),
      publicUrl: `https://${domain}/manga/${item.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: cover,
      largeCoverUrl: cover,
      tags: [],
      state: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    const query: Record<string, string> = {
      limit: String(params.limit),
      offset: String(params.offset),
      sort: sortFor(params.order),
      fields: 'id,name,slug,cover.filename_disk',
    };
    if (params.query?.trim()) query['search'] = params.query.trim();
    const res = await directusGet<DirectusListResponse<MangaListItem>>('/items/manga', query);
    return res.data.map(parseListItem);
  };

  const parseMangaUrl = (url: string): { mangaId: string; slug: string } => {
    const [mangaId, slug] = url.split(URL_DELIMITER);
    if (!mangaId || !slug) throw new ParseError(`Cannot parse manga url: ${url}`, SOURCE_ID);
    return { mangaId, slug };
  };

  /**
   * Each catalog entry here is a standalone release (a oneshot or a single translated chapter,
   * not a whole ongoing series) — live check against backend.hentaichan.cc shows 7035 of 7036
   * manga rows carry `chapters: 1`. `id` ordering (not `chapter_id`, which is near-always `1`
   * even across a manga's own multiple rows) is the only reliable upload order.
   */
  const fetchChapters = async (mangaId: string): Promise<RawChapter[]> => {
    const res = await directusGet<DirectusListResponse<ChapterListItem>>('/items/chapters', {
      'filter[manga][_eq]': mangaId,
      sort: 'id',
      fields: 'id',
    });
    return res.data.map((ch, index) => ({
      id: generateUid(SOURCE_ID, ch.id),
      title: null,
      number: index + 1,
      volume: 0,
      url: String(ch.id),
      scanlator: null,
      uploadDate: 0,
      branch: null,
      source: SOURCE_ID,
    }));
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const { mangaId, slug } = parseMangaUrl(mangaUrl);
    const [detailRes, chapters] = await Promise.all([
      directusGet<DirectusListResponse<MangaDetail>>('/items/manga', {
        'filter[id][_eq]': mangaId,
        limit: '1',
        fields:
          'id,name,slug,cover.filename_disk,description,russian_name,english_name,romaji_name,' +
          'tags.tags_id.name,tags.tags_id.slug,authors.authors_id.name',
      }),
      fetchChapters(mangaId),
    ]);
    const info = detailRes.data[0];
    if (!info) throw new ParseError(`Manga not found: ${mangaUrl}`, SOURCE_ID);

    const altTitles = [info.russian_name, info.english_name, info.romaji_name]
      .filter((t): t is string => !!t && t !== info.name)
      .filter((t, i, arr) => arr.indexOf(t) === i);

    const tags: RawTag[] = info.tags
      .map((t) => t.tags_id)
      .filter((t): t is { name: string; slug: string } => !!t)
      .map((t) => ({ title: toTitleCase(t.name), key: t.slug, source: SOURCE_ID }));

    const authors = [
      ...new Set(info.authors.map((a) => a.authors_id?.name).filter((n): n is string => !!n)),
    ];

    const cover = assetUrl(info.cover);

    return {
      id: generateUid(SOURCE_ID, info.id),
      title: info.name,
      altTitles,
      url: mangaUrl,
      publicUrl: `https://${domain}/manga/${slug}`,
      rating: RATING_UNKNOWN,
      contentRating: CONTENT_RATING.ADULT,
      coverUrl: cover,
      largeCoverUrl: cover,
      tags,
      state: null,
      authors,
      description: info.description,
      chapters,
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const res = await directusGet<DirectusItemResponse<ChapterPages>>(
      `/items/chapters/${chapterUrl}`,
      { fields: 'id,pages.directus_files_id.filename_disk' },
    );
    const pages = res.data?.pages ?? [];
    return pages
      .map((p) => assetUrl(p.directus_files_id))
      .filter((url): url is string => !!url)
      .map((url) => ({ id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID }));
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'HentaiChan',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.HENTAI,
      isBroken: false,
      isAdult: true,
      requiresVpn: true,
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

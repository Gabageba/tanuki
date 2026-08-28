import { RAW_MANGA_STATE } from '../../types';
import { CONTENT_RATING, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type {
  RawManga,
  RawChapter,
  RawPage,
  RawTag,
  RawMangaState,
  RawContentRating,
} from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { ParseError } from '../../errors';

const SOURCE_ID = 'TOMILOLIB';
const PAGE_SIZE = 24;
const CDN_URL = 'https://s3.regru.cloud/tomilolib';
const IMAGE_ACCEPT = 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5';

type ChapterJson = {
  _id?: string;
  isPublished?: boolean;
  chapterNumber?: number;
  name?: string | null;
  releaseDate?: string | null;
  createdAt?: string | null;
};

type MangaJson = {
  _id?: string;
  slug?: string;
  name?: string;
  coverImage?: string;
  genres?: string[];
  tags?: string[];
  author?: string;
  artist?: string;
  altNames?: string[];
  averageRating?: number;
  isAdult?: boolean;
  ageLimit?: number;
  status?: string;
  description?: string;
  chapters?: ChapterJson[];
};

const getApiSortBy = (order: string | undefined): string => {
  switch (order) {
    case 'POPULARITY':
    case 'POPULARITY_WEEK':
      return 'weekViews';
    case 'POPULARITY_TODAY':
      return 'dayViews';
    case 'POPULARITY_MONTH':
      return 'monthViews';
    case 'NEWEST':
      return 'createdAt';
    case 'RATING':
      return 'averageRating';
    case 'ALPHABETICAL':
    case 'ALPHABETICAL_DESC':
      return 'name';
    // UPDATED and no explicit order — same as the site's default /titles?sortBy=updatedAt
    default:
      return 'updatedAt';
  }
};

const getApiSortOrder = (order: string | undefined): string => {
  return order === 'ALPHABETICAL' ? 'asc' : 'desc';
};

const parseContentRating = (info: MangaJson): RawContentRating => {
  const ageLimit = info.ageLimit ?? 0;
  if (info.isAdult === true || ageLimit >= 18) return CONTENT_RATING.ADULT;
  if (ageLimit >= 16) return CONTENT_RATING.SUGGESTIVE;
  return CONTENT_RATING.SAFE;
};

const parseState = (raw: string | undefined): RawMangaState | null => {
  switch (raw?.toLowerCase()) {
    case 'ongoing':
      return RAW_MANGA_STATE.ONGOING;
    case 'completed':
      return RAW_MANGA_STATE.FINISHED;
    case 'pause':
      return RAW_MANGA_STATE.PAUSED;
    case 'cancelled':
      return RAW_MANGA_STATE.ABANDONED;
    default:
      return null;
  }
};

const splitList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/[,;/]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const toCdnUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const withoutUploads = path.startsWith('/uploads') ? path.slice('/uploads'.length) : path;
  const normalized = withoutUploads.startsWith('/') ? withoutUploads : `/${withoutUploads}`;
  return `${CDN_URL}${normalized}`;
};

const toCleanString = (n: number): string => {
  return Number.isInteger(n) ? String(n) : String(n);
};

const buildChapterTitle = (number: number, name: string | null | undefined): string | null => {
  const title = name?.trim() ?? '';
  if (title.length > 0) return title;
  return number > 0 ? `Глава ${toCleanString(number)}` : null;
};

const parseDate = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const parsed = Date.parse(raw.trim());
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const createTomiloLibParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;

  ctx.http.use((req, next) => {
    const headers: Record<string, string> = { ...req.headers, Referer: `https://${domain}/` };
    try {
      if (new URL(req.url).hostname === 's3.regru.cloud') {
        headers['Accept'] = IMAGE_ACCEPT;
      }
    } catch {
      /* not a valid URL — leave headers as-is */
    }
    return next({ ...req, headers });
  });

  const apiUrl = (path: string): URL => {
    return new URL(`https://${domain}/api/${path}`);
  };

  const parseTags = (info: MangaJson): RawTag[] => {
    const values = [...(info.genres ?? []), ...(info.tags ?? [])];
    const seen = new Set<string>();
    const tags: RawTag[] = [];
    for (const raw of values) {
      const value = raw.trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      tags.push({ key: value, title: value, source: SOURCE_ID });
    }
    return tags;
  };

  const parseChapterList = (
    chapters: ChapterJson[],
    slug: string,
    titleId: string,
  ): RawChapter[] => {
    return chapters
      .filter((ch) => ch._id && ch.isPublished !== false)
      .map((ch): RawChapter => {
        const number = ch.chapterNumber ?? 0;
        const url = `/titles/${slug}/chapter/${ch._id}?titleId=${titleId}`;
        return {
          id: generateUid(SOURCE_ID, url),
          title: buildChapterTitle(number, ch.name),
          number,
          volume: 0,
          url,
          scanlator: null,
          uploadDate: parseDate(ch.releaseDate ?? ch.createdAt),
          branch: null,
          source: SOURCE_ID,
        };
      });
  };

  const parseManga = (info: MangaJson | null, withDetails: boolean): RawManga | null => {
    if (!info || !info._id || !info.slug) return null;
    const slug = info.slug;
    const title = info.name ?? slug;
    const url = `/titles/${slug}`;
    const cover = info.coverImage ? toCdnUrl(info.coverImage) : null;
    const authors = [...splitList(info.author), ...splitList(info.artist)];
    const rating =
      info.averageRating != null && info.averageRating > 0
        ? info.averageRating / 10
        : RATING_UNKNOWN;

    return {
      id: generateUid(SOURCE_ID, url),
      title,
      altTitles: info.altNames?.map((s) => s.trim()).filter((s) => s.length > 0) ?? [],
      url,
      publicUrl: `https://${domain}${url}`,
      rating,
      contentRating: parseContentRating(info),
      coverUrl: cover,
      largeCoverUrl: cover,
      tags: parseTags(info),
      state: parseState(info.status),
      authors: [...new Set(authors)],
      description: withDetails ? (info.description ?? null) : null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<RawManga[]> => {
    const url = apiUrl('titles');
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('includeAdult', 'true');
    url.searchParams.set('sortBy', getApiSortBy(order));
    url.searchParams.set('sortOrder', getApiSortOrder(order));
    if (query?.trim()) url.searchParams.set('search', query.trim());

    const json = await ctx.http.getJson<{ data?: { titles?: MangaJson[] } }>(url.toString());
    const titles = json.data?.titles ?? [];
    return titles.map((t) => parseManga(t, false)).filter((m): m is RawManga => m !== null);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.query),
    );
  };

  const fetchChapters = async (titleId: string, slug: string): Promise<RawChapter[]> => {
    const url = apiUrl(`chapters/title/${titleId}`);
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', '10000');
    url.searchParams.set('sortOrder', 'asc');
    const json = await ctx.http.getJson<{ data?: { chapters?: ChapterJson[] } }>(url.toString());
    return parseChapterList(json.data?.chapters ?? [], slug, titleId);
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const slug = mangaUrl.replace(/\/$/, '').split('/').pop();
    if (!slug) throw new ParseError('Cannot parse title slug', SOURCE_ID);
    const url = apiUrl(`titles/slug/${slug}`);
    url.searchParams.set('populateChapters', 'true');
    const json = await ctx.http.getJson<{ data?: MangaJson }>(url.toString());
    const info = json.data;
    if (!info) throw new ParseError('Cannot parse title details', SOURCE_ID);
    const manga = parseManga(info, true);
    if (!manga) throw new ParseError('Cannot parse title details', SOURCE_ID);

    const titleId = info._id;
    const embeddedChapters =
      info.chapters && info.chapters.length > 0
        ? parseChapterList(info.chapters, slug, titleId ?? '')
        : [];
    const chapters =
      embeddedChapters.length > 0 || !titleId
        ? embeddedChapters
        : await fetchChapters(titleId, slug);

    return { ...manga, chapters };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const chapterId = new URL(chapterUrl, `https://${domain}/`).pathname
      .split('/')
      .filter(Boolean)
      .pop();
    if (!chapterId) throw new ParseError('Cannot parse chapter id', SOURCE_ID);
    const json = await ctx.http.getJson<{ data?: { pages?: string[] } }>(
      apiUrl(`chapters/${chapterId}`).toString(),
    );
    const pages = json.data?.pages ?? [];
    if (pages.length === 0) throw new ParseError('Cannot parse chapter pages', SOURCE_ID);
    return pages
      .map((path, i): RawPage | null => {
        const trimmed = path.trim();
        if (!trimmed) return null;
        return {
          id: generateUid(SOURCE_ID, `${chapterUrl}#${i}`),
          url: toCdnUrl(trimmed),
          preview: null,
          source: SOURCE_ID,
        };
      })
      .filter((p): p is RawPage => p !== null);
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'TomiloLib',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: [
        'POPULARITY',
        'POPULARITY_TODAY',
        'POPULARITY_WEEK',
        'POPULARITY_MONTH',
        'UPDATED',
        'NEWEST',
        'RATING',
        'ALPHABETICAL',
        'ALPHABETICAL_DESC',
      ],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
      isFiltersSupported: false,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/`, Accept: IMAGE_ACCEPT }),
  };
};

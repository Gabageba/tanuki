import { join } from 'node:path';
import { RAW_MANGA_STATE } from '../../types';
import { CONTENT_RATING, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawManga, RawChapter, RawPage, RawTag } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { concatUrl } from '../../core/html/urls';
import { NotFoundError, SourceAuthRequiredError } from '../../errors';
import { catalogEntryFor } from '../catalog';
import type { LibSocialConfig } from './config';
import { LIBSOCIAL_API_HOST } from './config';
import { getValidAccessToken } from './auth';

const PAGE_SIZE = 60;

const STATES: Record<number, RawManga['state']> = {
  1: RAW_MANGA_STATE.ONGOING,
  2: RAW_MANGA_STATE.FINISHED,
  3: RAW_MANGA_STATE.UPCOMING,
  4: RAW_MANGA_STATE.PAUSED,
  5: RAW_MANGA_STATE.ABANDONED,
};

const SERVER_MAIN = 'main';
const SERVER_SECONDARY = 'secondary';
const SERVER_COMPRESS = 'compress';
const SERVER_DOWNLOAD = 'download';

type CoverJson = {
  thumbnail: string;
  default: string;
};

type RatingJson = {
  average?: number;
};

type StatusJson = {
  id?: number;
};

type AgeRestrictionJson = {
  id?: number;
};

type MangaListItemJson = {
  id: number;
  name: string;
  rus_name?: string;
  slug_url: string;
  cover: CoverJson;
  rating?: RatingJson;
  status?: StatusJson;
};

type TagJson = {
  id: number;
  name: string;
};

type AuthorJson = {
  name?: string;
};

type MangaDetailsJson = {
  id: number;
  name: string;
  rus_name?: string;
  cover: CoverJson;
  genres: TagJson[];
  tags: TagJson[];
  authors: AuthorJson[];
  summary?: unknown;
  close_view?: number;
  rating?: RatingJson;
  status?: StatusJson;
  ageRestriction?: AgeRestrictionJson;
};

type BranchJson = {
  id: number;
  branch_id?: number;
  teams?: AuthorJson[];
  restricted_view?: { is_open?: boolean };
  created_at?: string;
};

type ChapterJson = {
  // The API sends these as JSON numbers most of the time, but switches to strings for some
  // manga (observed live on HENTAILIB) — coerce defensively rather than trusting the type.
  volume?: number | string;
  number?: number | string;
  name?: string | null;
  branches: BranchJson[];
};

type ImageServerJson = {
  id: string;
  url: string;
  site_ids: number[];
};

/**
 * MangaLib's "summary" field switched from a plain string to a TipTap/ProseMirror rich-text
 * doc (`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}`).
 * Flatten back to plain text, paragraphs joined by blank lines (matches Desu's convention —
 * see test/desu.test.ts — rather than the Kotlin fork's `nl2br()`, since there's no HTML
 * wrapping convention elsewhere in this package's `description` field).
 */
const summaryText = (summary: unknown): string => {
  if (typeof summary === 'string') return summary;
  if (!summary || typeof summary !== 'object') return '';
  const paragraphs: string[] = [];
  let current = '';
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as { type?: string; text?: string; content?: unknown[] };
    if (obj.type === 'text' && typeof obj.text === 'string') {
      current += obj.text;
      return;
    }
    obj.content?.forEach(walk);
    if (obj.type === 'paragraph') {
      paragraphs.push(current);
      current = '';
    }
  };
  walk(summary);
  return paragraphs.filter((p) => p.length > 0).join('\n\n');
};

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseRating = (rating: RatingJson | undefined): number => {
  return rating?.average != null ? rating.average / 10 : RATING_UNKNOWN;
};

const getSortBy = (order: string | undefined): string | null => {
  switch (order) {
    case 'UPDATED':
      return 'last_chapter_at';
    case 'POPULARITY':
      return 'views';
    case 'RATING':
      return 'rate_avg';
    case 'NEWEST':
      return 'created_at';
    case 'ALPHABETICAL':
    case 'ALPHABETICAL_DESC':
      return 'rus_name';
    default:
      return null;
  }
};

const getSortType = (order: string | undefined): string | null => {
  switch (order) {
    case 'UPDATED':
    case 'POPULARITY':
    case 'RATING':
    case 'NEWEST':
    case 'ALPHABETICAL_DESC':
      return 'desc';
    case 'ALPHABETICAL':
      return 'asc';
    default:
      return null;
  }
};

export const createLibSocialParser = (cfg: LibSocialConfig, ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  let imageServersPromise: Promise<Map<string, string>> | null = null;

  ctx.http.use((req, next) =>
    next({ ...req, headers: { ...req.headers, 'Site-Id': String(cfg.siteId) } }),
  );

  const tokenStoreDir = ctx.credentials.libsocial?.tokenStoreDir;
  const tokenStorePath = tokenStoreDir ? join(tokenStoreDir, `${cfg.id}.json`) : undefined;
  if (cfg.auth && tokenStorePath) {
    const auth = cfg.auth;
    ctx.http.use(async (req, next) => {
      const token = await getValidAccessToken(auth, cfg.siteId, tokenStorePath, cfg.id, ctx.logger);
      return next({ ...req, headers: { ...req.headers, Authorization: `Bearer ${token}` } });
    });
  }

  const parseManga = (jo: MangaListItemJson): RawManga => {
    const title = jo.rus_name && jo.rus_name.length > 0 ? jo.rus_name : jo.name;
    return {
      id: generateUid(cfg.id, jo.id),
      title,
      altTitles: [jo.name],
      url: jo.slug_url,
      publicUrl: `https://${domain}/ru/manga/${jo.slug_url}`,
      rating: parseRating(jo.rating),
      contentRating: cfg.isNsfw ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE,
      coverUrl: jo.cover.thumbnail,
      tags: [],
      state: jo.status?.id != null ? (STATES[jo.status.id] ?? null) : null,
      authors: [],
      largeCoverUrl: jo.cover.default,
      description: null,
      chapters: null,
      source: cfg.id,
    };
  };

  const fetchListPage = async (
    page: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<RawManga[]> => {
    const url = new URL(`https://${LIBSOCIAL_API_HOST}/api/manga`);
    url.searchParams.set('site_id[]', String(cfg.siteId));
    url.searchParams.append('fields[]', 'rate');
    url.searchParams.append('fields[]', 'rate_avg');
    url.searchParams.set('page', String(page));
    if (query) url.searchParams.set('q', query);
    const sortBy = getSortBy(order);
    if (sortBy) url.searchParams.set('sort_by', sortBy);
    const sortType = getSortType(order);
    if (sortType) url.searchParams.set('sort_type', sortType);

    const json = await ctx.http.getJson<{ data: MangaListItemJson[] }>(url.toString());
    return json.data.map(parseManga);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    // The API's own default (no sort_by at all) ranks by popularity, not by what's fresh —
    // callers that don't care about order should still see recently-updated titles first.
    const order = params.order ?? 'UPDATED';
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, order, params.query),
    );
  };

  const fetchChapters = async (mangaUrl: string): Promise<RawChapter[]> => {
    const url = `https://${LIBSOCIAL_API_HOST}/api/manga/${mangaUrl}/chapters`;
    const json = await ctx.http.getJson<{ data: ChapterJson[] }>(url);
    const chapters: RawChapter[] = [];
    for (const jo of json.data) {
      const volume = toNumber(jo.volume);
      const number = toNumber(jo.number);
      for (const branch of jo.branches) {
        if (branch.restricted_view && branch.restricted_view.is_open === false) continue;
        const branchId = branch.branch_id ?? 0;
        const team = branch.teams?.[0]?.name ?? null;
        let chapterUrl = `${mangaUrl}/chapter?number=${number}&volume=${volume}`;
        if (branchId !== 0) chapterUrl += `&branch_id=${branchId}`;
        chapters.push({
          id: generateUid(cfg.id, branch.id),
          title: jo.name ?? null,
          number,
          volume,
          url: chapterUrl,
          scanlator: team,
          uploadDate: parseIsoDate(branch.created_at),
          branch: team,
          source: cfg.id,
        });
      }
    }
    return chapters;
  };

  const parseTag = (prefix: string, jo: TagJson): RawTag => {
    return { title: jo.name, key: `${prefix}${jo.id}`, source: cfg.id };
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const detailsUrl = new URL(`https://${LIBSOCIAL_API_HOST}/api/manga/${mangaUrl}`);
    // 'status' used to be a valid explicit field but api.cdnlibs.org now rejects it with a 422
    // ("Выбранное значение для fields.N ошибочно") — it's already present in the base response
    // without being requested, so it never needed to be in this list.
    for (const field of [
      'summary',
      'genres',
      'tags',
      'authors',
      'close_view',
      'rate',
      'rate_avg',
    ]) {
      detailsUrl.searchParams.append('fields[]', field);
    }

    const [detailsRes, chapters] = await Promise.all([
      ctx.http.getJson<{ data: MangaDetailsJson }>(detailsUrl.toString()),
      fetchChapters(mangaUrl),
    ]);
    const json = detailsRes.data;

    const genres = json.genres.map((jo) => parseTag('g', jo));
    const tags = json.tags.map((jo) => parseTag('t', jo));
    const seenTitles = new Set<string>();
    const allTags = [...genres, ...tags].filter((tag) => {
      if (seenTitles.has(tag.title)) return false;
      seenTitles.add(tag.title);
      return true;
    });
    const authors = json.authors.map((a) => a.name).filter((n): n is string => !!n);
    const isRestricted = (json.close_view ?? 0) > 0;
    const title = json.rus_name && json.rus_name.length > 0 ? json.rus_name : json.name;
    const ageRestrictionId = json.ageRestriction?.id;

    return {
      id: generateUid(cfg.id, json.id),
      title,
      altTitles: [json.name],
      url: mangaUrl,
      publicUrl: `https://${domain}/ru/manga/${mangaUrl}`,
      rating: parseRating(json.rating),
      contentRating:
        ageRestrictionId != null
          ? ageRestrictionId >= 4
            ? CONTENT_RATING.SUGGESTIVE
            : cfg.isNsfw
              ? CONTENT_RATING.ADULT
              : CONTENT_RATING.SAFE
          : cfg.isNsfw
            ? CONTENT_RATING.ADULT
            : CONTENT_RATING.SAFE,
      coverUrl: json.cover.thumbnail,
      tags: allTags,
      state:
        chapters.length === 0 && isRestricted
          ? RAW_MANGA_STATE.RESTRICTED
          : json.status?.id != null
            ? (STATES[json.status.id] ?? null)
            : null,
      authors,
      largeCoverUrl: json.cover.default,
      description: summaryText(json.summary) || null,
      chapters,
      source: cfg.id,
    };
  };

  const fetchImageServers = async (): Promise<Map<string, string>> => {
    const url = `https://${LIBSOCIAL_API_HOST}/api/constants?fields[]=imageServers`;
    const json = await ctx.http.getJson<{ data: { imageServers: ImageServerJson[] } }>(url);
    const result = new Map<string, string>();
    for (const server of json.data.imageServers) {
      if (server.site_ids.includes(cfg.siteId)) result.set(server.id, server.url);
    }
    return result;
  };

  const getImageServers = (): Promise<Map<string, string>> => {
    imageServersPromise ??= fetchImageServers();
    return imageServersPromise;
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const url = concatUrl(`https://${LIBSOCIAL_API_HOST}/api/manga/`, chapterUrl);
    let pagesJson: { data: { pages: { id: number; url: string }[] } };
    try {
      pagesJson = await ctx.http.getJson<{ data: { pages: { id: number; url: string }[] } }>(url);
    } catch (err) {
      if (cfg.authRequiredOnMissingPages && err instanceof NotFoundError) {
        throw new SourceAuthRequiredError('Pages require an authenticated session', cfg.id);
      }
      throw err;
    }
    const servers = await getImageServers();
    const primary =
      servers.get(SERVER_MAIN) ?? servers.get(SERVER_DOWNLOAD) ?? servers.get(SERVER_SECONDARY);
    if (!primary) throw new NotFoundError('No available image servers', cfg.id);
    const compress = servers.get(SERVER_COMPRESS);

    return pagesJson.data.pages.map((page) => {
      // The API hands back page.url as e.g. "//manga/adabana/chapters/.../001.png" — a leading
      // `//` makes URL resolution treat "manga" as the *host*, discarding the real image server
      // entirely (a scheme-relative reference, not the host-relative path it's meant to be).
      // Collapsing to a single leading slash is what actually resolves against `primary`.
      const path = page.url.replace(/^\/+/, '/');
      return {
        id: generateUid(cfg.id, page.id),
        url: concatUrl(primary, path),
        preview: compress ? concatUrl(compress, path) : null,
        source: cfg.id,
      };
    });
  };

  return {
    id: cfg.id,
    info: {
      id: cfg.id,
      title: catalogEntryFor(cfg.id).title,
      domain,
      locale: 'ru',
      contentType: cfg.isNsfw ? SOURCE_CONTENT_TYPE.hentai : SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: catalogEntryFor(cfg.id).isAdult,
      sortOrders: [
        'UPDATED',
        'POPULARITY',
        'RATING',
        'NEWEST',
        'ALPHABETICAL',
        'ALPHABETICAL_DESC',
      ],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
    async init() {
      if (!cfg.auth) return;
      if (!tokenStorePath) {
        ctx.logger.warn(
          `${cfg.id}: no LIBSOCIAL_TOKEN_STORE_PATH configured — auth-gated pages will fail`,
        );
        return;
      }
      try {
        await getValidAccessToken(cfg.auth, cfg.siteId, tokenStorePath, cfg.id, ctx.logger);
      } catch (err) {
        ctx.logger.warn(
          `${cfg.id}: LibSocial token warmup failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  };
};

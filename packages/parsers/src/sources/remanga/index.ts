import { RAW_MANGA_STATE } from '../../types';
import { CONTENT_RATING, SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchPaged } from '../../core/paging';
import type { RawManga, RawChapter, RawPage, RawTag, RawMangaState } from '../../types';
import { RATING_UNKNOWN } from '../../types';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { NotFoundError } from '../../errors';

const SOURCE_ID = 'REMANGA';
const PAGE_SIZE = 20;

const STATES: Record<number, RawMangaState> = {
  1: RAW_MANGA_STATE.FINISHED,
  2: RAW_MANGA_STATE.ONGOING,
  3: RAW_MANGA_STATE.PAUSED,
  4: RAW_MANGA_STATE.ABANDONED,
  5: RAW_MANGA_STATE.UPCOMING,
  6: RAW_MANGA_STATE.RESTRICTED,
};

type CoverJson = {
  mid?: string;
  high?: string;
};

type TagJson = {
  id: number;
  name: string;
};

type StatusJson = {
  id?: number;
};

type AgeLimitJson = {
  id?: number;
};

type MangaJson = {
  dir: string;
  main_name: string;
  secondary_name?: string;
  another_name?: string;
  avg_rating?: number;
  cover: CoverJson;
  status?: StatusJson;
  age_limit?: AgeLimitJson;
  genres?: TagJson[];
  description?: string;
  branches?: { id: number; publishers?: { name?: string } }[];
  detail?: { message?: string };
};

type PublisherJson = {
  name?: string;
};

type ChapterJson = {
  id: number;
  chapter?: number;
  tome?: number;
  name?: string;
  upload_date?: string;
  is_paid?: boolean;
  is_bought?: boolean;
  publishers?: PublisherJson[];
};

type PageJson = {
  link: string;
};

const getSortKey = (order: string | undefined): string => {
  switch (order) {
    case 'POPULARITY':
      return '-rating';
    case 'RATING':
      return '-votes';
    case 'NEWEST':
      return '-id';
    default:
      return '-chapter_date';
  }
};

const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createRemangaParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const apiHost = `api.${domain}`;

  // The upstream API rate-limits aggressively; the Kotlin fork retries once after a short
  // delay instead of surfacing a hard failure for a single transient 429.
  ctx.http.use(async (req, next) => {
    const res = await next(req);
    if (res.status === 429) {
      await sleep(1000);
      return next(req);
    }
    return res;
  });

  const parseTags = (genres: TagJson[] | undefined): RawTag[] => {
    return (genres ?? []).map((g) => ({
      title: toTitleCase(g.name),
      key: String(g.id),
      source: SOURCE_ID,
    }));
  };

  const parseManga = (jo: MangaJson): RawManga => {
    const url = `/manga/${jo.dir}`;
    const cover = jo.cover;
    return {
      id: generateUid(SOURCE_ID, url),
      title: jo.main_name,
      altTitles: jo.secondary_name ? [jo.secondary_name] : [],
      url,
      publicUrl: `https://${domain}${url}/main`,
      rating: jo.avg_rating != null ? jo.avg_rating / 10 : RATING_UNKNOWN,
      contentRating: null,
      coverUrl: cover.mid ? toAbsoluteUrl(cover.mid, apiHost) : null,
      largeCoverUrl: cover.high ? toAbsoluteUrl(cover.high, apiHost) : null,
      tags: parseTags(jo.genres),
      state: jo.status?.id != null ? (STATES[jo.status.id] ?? null) : null,
      authors: [],
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
    const path = query ? '/api/v2/search' : '/api/v2/search/catalog';
    const url = new URL(`https://${apiHost}${path}`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('count', String(PAGE_SIZE));
    url.searchParams.set('ordering', getSortKey(order));
    if (query) url.searchParams.set('query', query);

    const json = await ctx.http.getJson<{ results: MangaJson[] }>(url.toString());
    return json.results.map(parseManga);
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, (page) =>
      fetchListPage(page, params.order, params.query),
    );
  };

  const slugFromUrl = (mangaUrl: string): string => {
    const trimmed = mangaUrl.replace(/\/$/, '');
    return trimmed.split('/').pop() ?? trimmed;
  };

  const fetchAllChapters = async (branchId: number): Promise<ChapterJson[]> => {
    const result: ChapterJson[] = [];
    for (let page = 1; ; page += 1) {
      const url = `https://${apiHost}/api/v2/titles/chapters/?branch_id=${branchId}&page=${page}&count=500`;
      const json = await ctx.http.getJson<{ results: ChapterJson[] }>(url);
      if (json.results.length === 0) break;
      result.push(...json.results);
    }
    return result;
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const slug = slugFromUrl(mangaUrl);
    const json = await ctx.http.getJson<MangaJson>(`https://${apiHost}/api/v2/titles/${slug}/`);

    const url = `/manga/${json.dir}`;
    const cover = json.cover;
    const altTitles = [
      ...(json.another_name?.split(' / ').map((s) => s.trim()) ?? []),
      ...(json.secondary_name ? [json.secondary_name] : []),
    ].filter((t) => t.length > 0);

    const chapters: RawChapter[] = [];
    for (const branch of json.branches ?? []) {
      const branchName = branch.publishers?.name ?? null;
      const branchChapters = (await fetchAllChapters(branch.id)).slice().reverse();
      for (const cjo of branchChapters) {
        if (cjo.is_paid && !cjo.is_bought) continue;
        chapters.push({
          id: generateUid(SOURCE_ID, cjo.id),
          title: cjo.name ? toTitleCase(cjo.name) : null,
          number: cjo.chapter ?? 0,
          volume: cjo.tome ?? 0,
          url: `/api/v2/titles/chapters/${cjo.id}/`,
          scanlator: cjo.publishers?.[0]?.name ?? null,
          uploadDate: parseIsoDate(cjo.upload_date),
          branch: branchName,
          source: SOURCE_ID,
        });
      }
    }

    return {
      id: generateUid(SOURCE_ID, url),
      title: json.main_name,
      altTitles,
      url,
      publicUrl: `https://${domain}${url}/main`,
      rating: json.avg_rating != null ? json.avg_rating / 10 : RATING_UNKNOWN,
      contentRating:
        json.age_limit?.id === 0
          ? CONTENT_RATING.SAFE
          : json.age_limit?.id === 1 || json.age_limit?.id === 2
            ? CONTENT_RATING.SUGGESTIVE
            : null,
      coverUrl: cover.mid ? toAbsoluteUrl(cover.mid, apiHost) : null,
      largeCoverUrl: cover.high ? toAbsoluteUrl(cover.high, apiHost) : null,
      tags: parseTags(json.genres),
      state: json.status?.id != null ? (STATES[json.status.id] ?? null) : null,
      authors: [],
      description: json.description ?? null,
      chapters,
      source: SOURCE_ID,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const url = toAbsoluteUrl(chapterUrl, apiHost);
    const json = await ctx.http.getJson<{ pages?: (PageJson | PageJson[])[]; pub_date?: string }>(
      url,
    );
    if (!json.pages) {
      throw new NotFoundError('Chapter is not available yet', SOURCE_ID);
    }
    const result: RawPage[] = [];
    for (const item of json.pages) {
      const entries = Array.isArray(item) ? item : [item];
      for (const page of entries) {
        result.push({
          id: generateUid(SOURCE_ID, page.link),
          url: toAbsoluteUrl(page.link, apiHost),
          preview: null,
          source: SOURCE_ID,
        });
      }
    }
    return result;
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'Реманга',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: false,
      requiresVpn: false,
      sortOrders: ['UPDATED', 'POPULARITY', 'RATING', 'NEWEST'],
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

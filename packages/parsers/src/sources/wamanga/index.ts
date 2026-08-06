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

const SOURCE_ID = 'WAMANGA';
const PAGE_SIZE = 20;

type MangaJson = {
  id: string;
  slug: string;
  title: string;
  titleEnglish?: string;
  alternateTitles?: string[];
  coverUrl?: string;
  imageUrl?: string;
  genres?: string[];
  statusTitle?: string;
  authors?: string[];
  isAdult?: boolean;
  description?: string;
  teams?: { name?: string }[];
};

type ChapterJson = {
  id: string;
  position?: number;
  title?: string;
  createdAt?: string;
};

type PageFileJson = {
  diskFile: string;
};

const parseState = (status: string | undefined): RawMangaState | null => {
  switch (status?.toLowerCase()) {
    case 'ongoing':
      return RAW_MANGA_STATE.ONGOING;
    case 'finished':
    case 'completed':
      return RAW_MANGA_STATE.FINISHED;
    case 'abandoned':
      return RAW_MANGA_STATE.ABANDONED;
    case 'paused':
    case 'frozen':
      return RAW_MANGA_STATE.PAUSED;
    default:
      return null;
  }
};

const parseTags = (jo: { genres?: string[] }): RawTag[] => {
  const seen = new Set<string>();
  const tags: RawTag[] = [];
  for (const name of jo.genres ?? []) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    tags.push({ title: toTitleCase(name), key: name, source: SOURCE_ID });
  }
  return tags;
};

const collectAltTitles = (jo: MangaJson): string[] => {
  const result: string[] = [];
  if (jo.titleEnglish) result.push(jo.titleEnglish);
  for (const t of jo.alternateTitles ?? []) {
    if (t) result.push(t);
  }
  return [...new Set(result)];
};

/**
 * `sortKey`/`sortDescending` per the site's own OpenAPI spec (https://wamanga.ru/api/docs-json):
 * sortKey ∈ createdAt | updatedAt | publicDate | views | likes | alphabetical. `updatedAt` desc is
 * what the site's homepage `freshUpdates` block is built from, so it's the default here — the
 * upstream default (`alphabetical`) pins the catalog to the same "100 девушек..." first page forever.
 * `likes` is deliberately unmapped: the API accepts it but returns alphabetical order for it.
 */
const getSortKey = (order: string | undefined): { key: string; descending: boolean } => {
  switch (order) {
    case 'ALPHABETICAL':
      return { key: 'alphabetical', descending: false };
    case 'NEWEST':
      return { key: 'createdAt', descending: true };
    case 'POPULARITY':
      return { key: 'views', descending: true };
    default:
      return { key: 'updatedAt', descending: true };
  }
};

const parseIsoDate = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const createWaMangaParser = (ctx: ParserContext): Parser => {
  const domain = ctx.domain;
  const apiUrl = `https://${domain}/api/v1`;

  const parseManga = (jo: MangaJson): RawManga => {
    return {
      id: generateUid(SOURCE_ID, jo.id),
      title: jo.title,
      altTitles: collectAltTitles(jo),
      url: jo.id,
      publicUrl: `https://${domain}/manga/${jo.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: jo.isAdult ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE,
      coverUrl: jo.coverUrl ? toAbsoluteUrl(jo.coverUrl, domain) : null,
      largeCoverUrl: jo.imageUrl ? toAbsoluteUrl(jo.imageUrl, domain) : null,
      tags: parseTags(jo),
      state: parseState(jo.statusTitle),
      authors: jo.authors ?? [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  };

  const getList = async (params: ListParams): Promise<RawManga[]> => {
    return fetchPaged(params, { size: PAGE_SIZE, firstPage: 1 }, async (page) => {
      const offset = (page - 1) * PAGE_SIZE;
      const url = new URL(`${apiUrl}/manga`);
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));
      const sort = getSortKey(params.order);
      url.searchParams.set('sortKey', sort.key);
      url.searchParams.set('sortDescending', String(sort.descending));
      if (params.query) url.searchParams.set('query', params.query);
      const items = await ctx.http.getJson<MangaJson[]>(url.toString());
      return items.map(parseManga);
    });
  };

  const getDetails = async (mangaUrl: string): Promise<RawManga> => {
    const [jo, chaptersJson] = await Promise.all([
      ctx.http.getJson<MangaJson>(`${apiUrl}/manga/${mangaUrl}`),
      ctx.http.getJson<ChapterJson[]>(`${apiUrl}/manga/${mangaUrl}/chapters`),
    ]);

    const scanlator =
      (jo.teams ?? [])
        .map((t) => t.name)
        .filter((n): n is string => !!n)
        .join(', ') || null;

    const chapters: RawChapter[] = chaptersJson.map((ch) => ({
      id: generateUid(SOURCE_ID, ch.id),
      url: ch.id,
      title: ch.title && ch.title.length > 0 ? ch.title : null,
      number: ch.position ?? 0,
      volume: 0,
      scanlator,
      uploadDate: parseIsoDate(ch.createdAt),
      branch: null,
      source: SOURCE_ID,
    }));

    return {
      ...parseManga(jo),
      description: jo.description ?? null,
      chapters,
    };
  };

  const getPages = async (chapterUrl: string): Promise<RawPage[]> => {
    const json = await ctx.http.getJson<{ files: PageFileJson[] }>(
      `${apiUrl}/chapters/${chapterUrl}`,
    );
    return json.files.map((file) => {
      const url = toAbsoluteUrl(file.diskFile, domain);
      return { id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID };
    });
  };

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: 'WaManga',
      domain,
      locale: 'ru',
      contentType: SOURCE_CONTENT_TYPE.manga,
      isBroken: false,
      isAdult: false,
      sortOrders: ['UPDATED', 'NEWEST', 'POPULARITY', 'ALPHABETICAL'],
      isSearchSupported: true,
      isMultipleTagsSupported: false,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
};

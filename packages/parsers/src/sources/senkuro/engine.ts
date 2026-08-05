import type { Parser, ParserContext } from '../../core/parser';
import type { ListParams } from '../../core/paging';
import { fetchCursorPaged } from '../../core/paging';
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
import { toAbsoluteUrl } from '../../core/html/urls';
import { toTitleCase } from '../../core/text/strings';
import { ParseError, SourceUnavailableError } from '../../errors';
import { catalogEntryFor } from '../catalog';
import type { SenkuroConfig } from './config';

const URL_DELIMITER = ',,';
// Every domain a Senkuro-family source registers in ../catalog.ts is a mirror of the same
// frontend and reaches the same backend — the API host and the catalog-selecting app-id come
// from the config, not the domain.
const LIST_MAX_PAGE_SIZE = 100;

interface LocalizedText {
  lang?: string;
  content?: string;
}

interface LocalizedDescription {
  lang?: string;
  description?: string;
}

interface CoverJson {
  original?: { url?: string };
}

interface LabelJson {
  slug?: string;
  titles?: LocalizedText[];
}

interface MangaCardJson {
  id?: string;
  slug?: string;
  titles?: LocalizedText[];
  cover?: CoverJson;
}

interface MangaInfoJson extends MangaCardJson {
  alternativeNames?: LocalizedText[];
  localizations?: LocalizedDescription[];
  status?: string;
  rating?: string;
  labels?: LabelJson[];
  mainStaff?: { person?: { name?: string } }[];
}

interface ChapterJson {
  id?: string;
  slug?: string;
  teamIds?: string[];
  number?: string;
  volume?: string;
  name?: string;
  createdAt?: string;
}

interface TeamJson {
  id?: string;
  name?: string;
}

function parseState(raw: string | undefined): RawMangaState | null {
  switch (raw?.toUpperCase()) {
    case 'FINISHED':
      return 'FINISHED';
    case 'ONGOING':
      return 'ONGOING';
    case 'HIATUS':
      return 'PAUSED';
    case 'ANNOUNCE':
      return 'UPCOMING';
    case 'CANCELLED':
      return 'ABANDONED';
    default:
      return null;
  }
}

function parseContentRating(raw: string | undefined): RawContentRating | null {
  switch (raw?.toUpperCase()) {
    case 'EXPLICIT':
      return 'ADULT';
    case 'QUESTIONABLE':
    case 'SENSITIVE':
      return 'SUGGESTIVE';
    case 'GENERAL':
      return 'SAFE';
    default:
      return null;
  }
}

function pickLocalizedTitle(items: LocalizedText[] | undefined): string | null {
  if (!items || items.length === 0) return null;
  let first: string | null = null;
  let en: string | null = null;
  for (const item of items) {
    const text = item.content?.trim();
    if (!text) continue;
    first ??= text;
    const lang = item.lang?.toUpperCase();
    if (lang === 'RU') return text;
    if (lang === 'EN') en ??= text;
  }
  return en ?? first;
}

function parseLocalizationDescription(items: LocalizedDescription[] | undefined): string | null {
  if (!items || items.length === 0) return null;
  let first: string | null = null;
  for (const item of items) {
    const text = item.description?.trim();
    if (!text) continue;
    first ??= text;
    if (item.lang?.toUpperCase() === 'RU') return text;
  }
  return first;
}

function parseTitleList(items: LocalizedText[] | undefined): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of items ?? []) {
    const text = item.content?.trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
  }
  return result;
}

function buildChapterTitle(
  volume: string | undefined,
  number: string | undefined,
  name: string | undefined,
): string | null {
  const parts: string[] = [];
  if (volume?.trim()) parts.push(`${volume.trim()}.`);
  if (number?.trim()) parts.push(`Глава ${number.trim()}`);
  let built = parts.join(' ');
  const title = name?.trim();
  if (title) built = built.length > 0 ? `${built} ${title}` : title;
  return built.length > 0 ? built : null;
}

function parseIsoDate(raw: string | undefined): number {
  const value = raw?.trim();
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function createSenkuroParser(cfg: SenkuroConfig, ctx: ParserContext): Parser {
  const domain = ctx.domain;
  const SOURCE_ID = cfg.id;

  async function postGraphQl(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const res = await ctx.http.request({
      method: 'POST',
      url: cfg.apiEndpoint,
      headers: {
        'Content-Type': 'application/json',
        // Selects which of the backend's catalogs to answer from — see ./config.ts. Without it
        // every source would serve Senkuro's catalog.
        'app-id': cfg.appId,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/`,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status >= 400) {
      throw new SourceUnavailableError(`Upstream HTTP ${res.status}`, SOURCE_ID);
    }
    const json = res.json<{ errors?: unknown[]; data?: Record<string, unknown> }>();
    if (json.errors && json.errors.length > 0) {
      throw new ParseError(JSON.stringify(json.errors), SOURCE_ID);
    }
    if (!json.data) throw new ParseError('GraphQL response has no data', SOURCE_ID);
    return json.data;
  }

  function parseMangaCard(info: MangaCardJson | null | undefined): RawManga | null {
    if (!info?.id || !info.slug) return null;
    const url = [info.id, info.slug].join(URL_DELIMITER);
    const title = pickLocalizedTitle(info.titles) ?? info.slug;
    const cover = info.cover?.original?.url ?? null;
    return {
      id: generateUid(SOURCE_ID, info.id),
      title,
      altTitles: [],
      url,
      publicUrl: `https://${domain}/manga/${info.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: null,
      coverUrl: cover,
      largeCoverUrl: cover,
      tags: [],
      state: null,
      authors: [],
      description: null,
      chapters: null,
      source: SOURCE_ID,
    };
  }

  // Confirmed against the live endpoint: MangaOrderField only accepts VIEWS, SCORE, CREATED_AT
  // and LAST_CHAPTER_AT (introspection is disabled, so this was found by probing). VIEWS is the
  // closest match to "popularity"; LAST_CHAPTER_AT is what senkuro.me's own "last updated" browse
  // sort uses. Descending matches every other source's UPDATED/POPULARITY convention in this repo.
  function mapOrderBy(order: string | undefined): { field: string; direction: string } {
    switch (order) {
      case 'POPULARITY':
        return { field: 'VIEWS', direction: 'DESC' };
      case 'UPDATED':
      default:
        return { field: 'LAST_CHAPTER_AT', direction: 'DESC' };
    }
  }

  async function fetchListPage(
    cursor: string | null,
    first: number,
    order: string | undefined,
    query: string | undefined,
  ): Promise<{ items: RawManga[]; nextCursor: string | null }> {
    const variables: Record<string, unknown> = {
      after: cursor,
      first,
      orderBy: mapOrderBy(order),
    };
    if (query?.trim()) variables['search'] = query.trim();

    const data = await postGraphQl(LIST_QUERY, variables);
    const payload = data['mangas'] as
      | {
          edges?: { node?: MangaCardJson }[];
          pageInfo?: { hasNextPage?: boolean; endCursor?: string };
        }
      | undefined;
    const items = (payload?.edges ?? [])
      .map((edge) => parseMangaCard(edge.node))
      .filter((m): m is RawManga => m !== null);
    const nextCursor = payload?.pageInfo?.hasNextPage ? (payload.pageInfo.endCursor ?? null) : null;
    return { items, nextCursor };
  }

  async function getList(params: ListParams): Promise<RawManga[]> {
    return fetchCursorPaged(params, { maxPageSize: LIST_MAX_PAGE_SIZE }, (cursor, first) =>
      fetchListPage(cursor, first, params.order, params.query),
    );
  }

  function parseMangaUrl(url: string): { mangaId: string; mangaSlug: string } {
    const [mangaId, mangaSlug] = url.split(URL_DELIMITER);
    if (!mangaId || !mangaSlug) throw new ParseError(`Cannot parse manga url: ${url}`, SOURCE_ID);
    return { mangaId, mangaSlug };
  }

  function parseMangaInfo(info: MangaInfoJson): RawManga | null {
    const title = pickLocalizedTitle(info.titles);
    if (!title || !info.id || !info.slug) return null;
    const url = [info.id, info.slug].join(URL_DELIMITER);
    const altTitles = parseTitleList(info.alternativeNames);
    const cover = info.cover?.original?.url ?? null;

    const descriptionParts: string[] = [];
    if (altTitles.length > 0) {
      descriptionParts.push(`Альтернативные названия:\n${altTitles.join(' / ')}`);
    }
    const ruDescription = parseLocalizationDescription(info.localizations);
    if (ruDescription) descriptionParts.push(ruDescription);

    const authors = [
      ...new Set(
        (info.mainStaff ?? [])
          .map((s) => s.person?.name?.trim())
          .filter((n): n is string => !!n && n.length > 0),
      ),
    ];

    const tags: RawTag[] = (info.labels ?? [])
      .map((label): RawTag | null => {
        const slug = label.slug;
        const labelTitle = pickLocalizedTitle(label.titles);
        if (!slug || !labelTitle) return null;
        return { key: slug, title: toTitleCase(labelTitle), source: SOURCE_ID };
      })
      .filter((t): t is RawTag => t !== null);

    return {
      id: generateUid(SOURCE_ID, info.id),
      title,
      altTitles,
      url,
      publicUrl: `https://${domain}/manga/${info.slug}`,
      rating: RATING_UNKNOWN,
      contentRating: parseContentRating(info.rating),
      coverUrl: cover,
      largeCoverUrl: cover,
      tags,
      state: parseState(info.status),
      authors,
      description: descriptionParts.length > 0 ? descriptionParts.join('\n\n') : null,
      chapters: null,
      source: SOURCE_ID,
    };
  }

  async function fetchChapters(mangaId: string, mangaSlug: string): Promise<RawChapter[]> {
    const data = await postGraphQl(CHAPTERS_QUERY, { mangaId });
    const payload = data['mangaTachiyomiChapters'] as
      { chapters?: ChapterJson[]; teams?: TeamJson[] } | undefined;
    const teamsById = new Map<string, string>();
    for (const team of payload?.teams ?? []) {
      if (team.id && team.name) teamsById.set(team.id, team.name);
    }

    const chapters: RawChapter[] = (payload?.chapters ?? [])
      .map((ch): RawChapter | null => {
        if (!ch.id || !ch.slug) return null;
        const numberRaw = ch.number?.replace(',', '.');
        const number = numberRaw ? Number.parseFloat(numberRaw) || 0 : 0;
        const volume = ch.volume ? Number.parseInt(ch.volume, 10) || 0 : 0;
        const scanlator =
          [
            ...new Set(
              (ch.teamIds ?? []).map((id) => teamsById.get(id)).filter((n): n is string => !!n),
            ),
          ].join(', ') || null;
        const url = [mangaId, mangaSlug, ch.id, ch.slug].join(URL_DELIMITER);
        return {
          id: generateUid(SOURCE_ID, url),
          title: buildChapterTitle(ch.volume, ch.number, ch.name),
          number,
          volume,
          url,
          scanlator,
          uploadDate: parseIsoDate(ch.createdAt),
          branch: null,
          source: SOURCE_ID,
        };
      })
      .filter((c): c is RawChapter => c !== null);
    return chapters.reverse();
  }

  async function getDetails(mangaUrl: string): Promise<RawManga> {
    const { mangaId, mangaSlug } = parseMangaUrl(mangaUrl);
    const [data, chapters] = await Promise.all([
      postGraphQl(DETAILS_QUERY, { mangaId }),
      fetchChapters(mangaId, mangaSlug),
    ]);
    const info = data['mangaTachiyomiInfo'] as MangaInfoJson | undefined;
    if (!info) throw new ParseError('Cannot parse manga details', SOURCE_ID);
    const manga = parseMangaInfo(info);
    if (!manga) throw new ParseError('Cannot parse manga details', SOURCE_ID);
    return { ...manga, chapters };
  }

  async function getPages(chapterUrl: string): Promise<RawPage[]> {
    const parts = chapterUrl.split(URL_DELIMITER);
    const mangaId = parts[0];
    const chapterId = parts[2];
    if (!mangaId) throw new ParseError('Cannot parse manga id', SOURCE_ID);
    if (!chapterId) throw new ParseError('Cannot parse chapter id', SOURCE_ID);

    const data = await postGraphQl(CHAPTER_PAGES_QUERY, { mangaId, chapterId });
    const payload = data['mangaTachiyomiChapterPages'] as
      { pages?: { url?: string }[] } | undefined;
    return (payload?.pages ?? [])
      .map((p): RawPage | null => {
        if (!p.url) return null;
        const url = toAbsoluteUrl(p.url, domain);
        return { id: generateUid(SOURCE_ID, url), url, preview: null, source: SOURCE_ID };
      })
      .filter((p): p is RawPage => p !== null);
  }

  return {
    id: SOURCE_ID,
    info: {
      id: SOURCE_ID,
      title: catalogEntryFor(SOURCE_ID).title,
      locale: 'ru',
      contentType: catalogEntryFor(SOURCE_ID).contentType,
      isBroken: catalogEntryFor(SOURCE_ID).isBroken,
      sortOrders: ['POPULARITY', 'UPDATED'],
      isSearchSupported: true,
      isMultipleTagsSupported: true,
    },
    getList,
    getDetails,
    getPages,
    imageHeaders: () => ({ Referer: `https://${domain}/` }),
  };
}

const LIST_QUERY = `
query fetchMangas(
  $after: String,
  $first: Int,
  $search: String,
  $orderBy: MangaOrder
) {
  mangas(
    after: $after,
    first: $first,
    search: $search,
    orderBy: $orderBy
  ) {
    edges {
      node {
        id
        slug
        titles {
          lang
          content
        }
        cover {
          original {
            url
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

const DETAILS_QUERY = `
query fetchTachiyomiManga($mangaId: ID!) {
  mangaTachiyomiInfo(mangaId: $mangaId) {
    id
    slug
    titles {
      lang
      content
    }
    alternativeNames {
      lang
      content
    }
    localizations {
      lang
      description
    }
    type
    rating
    status
    formats
    labels {
      id
      rootId
      slug
      titles {
        lang
        content
      }
    }
    translationStatus
    cover {
      original {
        url
      }
    }
    mainStaff {
      roles
      person {
        name
      }
    }
  }
}
`;

const CHAPTERS_QUERY = `
query fetchTachiyomiChapters($mangaId: ID!) {
  mangaTachiyomiChapters(mangaId: $mangaId) {
    message
    chapters {
      id
      slug
      branchId
      name
      teamIds
      number
      volume
      createdAt
    }
    teams {
      id
      slug
      name
    }
  }
}
`;

const CHAPTER_PAGES_QUERY = `
query fetchTachiyomiChapterPages(
  $mangaId: ID!,
  $chapterId: ID!
) {
  mangaTachiyomiChapterPages(
    mangaId: $mangaId,
    chapterId: $chapterId
  ) {
    pages {
      url
    }
  }
}
`;

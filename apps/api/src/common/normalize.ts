import {
  CONTENT_RATING,
  type Branch,
  type Chapter,
  type FilterGroup,
  type FilterOption,
  type Title,
  type Page,
  type Tag,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { buildSignedImageUrl } from '../img-proxy/sign.util';
import { IMAGE_FORMAT } from '../img-proxy/models';
import { toServerDate, toServerDateTime } from './dates';
import { encodeChapterId, encodeTitleId } from './opaque-id';
import type {
  RawChapter,
  RawFilterGroup,
  RawFilterOption,
  RawTitle,
  RawPage,
  RawTag,
} from '../parsers-client/parsers-client.types';

const normalizeTag = (raw: RawTag): Tag => {
  return { id: raw.key, title: raw.title };
};

const normalizeFilterOption = (raw: RawFilterOption): FilterOption => {
  return { key: raw.key, title: raw.title, count: raw.count, excludable: raw.excludable };
};

export const normalizeFilterGroup = (raw: RawFilterGroup): FilterGroup => {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    options: raw.options.map(normalizeFilterOption),
    settings: raw.settings,
    exclusiveGroup: raw.exclusiveGroup,
    sortOrders: raw.sortOrders,
    supportsDirection: raw.supportsDirection,
  };
};

export const titleIdOf = (sourceId: string, raw: Pick<RawTitle, 'id' | 'url'>): string => {
  return `${sourceId}:${encodeTitleId({ id: raw.id, url: raw.url })}`;
};

/** Latest chapter's own upload date — `chapters` is only populated by getDetails (null on list
 *  items), so this is null wherever a full chapter list wasn't fetched. */
const latestChapterUploadDate = (chapters: RawChapter[] | null): number | null => {
  const dates = (chapters ?? []).map((c) => c.uploadDate).filter((d) => d > 0);
  return dates.length > 0 ? Math.max(...dates) : null;
};

/** A title translated by several teams reports one branch per team, each with its own copy of
 *  the same chapters — summing every branch's length (the naive `chapters.length`) overcounts by
 *  as many multiples as there are branches. The number that actually matches the source's own
 *  "N chapters" figure is the largest branch, the same one pickDefaultBranch treats as "the"
 *  translation. */
const maxBranchChaptersCount = (chapters: RawChapter[]): number => {
  return Math.max(0, ...groupByBranch(chapters).map((group) => group.items.length));
};

export const normalizeTitle = (
  env: Pick<Env, 'IMG_SIGN_SECRET'>,
  sourceId: string,
  raw: RawTitle,
): Title => {
  const coverUrl = raw.coverUrl
    ? buildSignedImageUrl(env.IMG_SIGN_SECRET, sourceId, raw.coverUrl, {
        width: 360,
        format: IMAGE_FORMAT.WEBP,
      })
    : '';
  const largeCoverUrl = raw.largeCoverUrl
    ? buildSignedImageUrl(env.IMG_SIGN_SECRET, sourceId, raw.largeCoverUrl, {
        width: 1080,
        format: IMAGE_FORMAT.WEBP,
      })
    : null;
  const lastChapterDate = latestChapterUploadDate(raw.chapters);

  return {
    id: titleIdOf(sourceId, raw),
    sourceId,
    slug: String(raw.id),
    name: raw.title,
    originalNames: raw.originalTitle ?? [],
    altNames: raw.altTitles,
    coverUrl,
    largeCoverUrl,
    description: raw.description,
    authors: raw.authors,
    artists: raw.artists ?? [],
    publishers: raw.publishers ?? [],
    magazines: raw.magazines ?? [],
    translators: raw.translators ?? [],
    tags: raw.tags.map(normalizeTag),
    releaseState: raw.releaseState,
    translationState: raw.translationState ?? null,
    restriction: raw.restriction ?? null,
    contentRating: raw.contentRating ?? CONTENT_RATING.SAFE,
    type: raw.type ?? null,
    country: raw.country ?? null,
    series: raw.series ?? [],
    year: raw.year ?? null,
    releaseDate: raw.releaseDate ? toServerDate(raw.releaseDate) : null,
    releaseFormats: raw.releaseFormats ?? [],
    addedAt: raw.addedAt ? toServerDateTime(raw.addedAt) : null,
    lastUpdatedAt: lastChapterDate !== null ? toServerDateTime(lastChapterDate) : null,
    // raw.rating is normalized to 0..1 by every parser (see RawTitle in @tanuki/parsers) —
    // scale it up to the 0..10 the API exposes, rounded to 1 decimal so it's ready to display
    // as-is, with no further formatting on the client.
    rating: raw.rating >= 0 ? Math.round(raw.rating * 100) / 10 : null,
    votesCount: raw.votesCount ?? null,
    likes: raw.likes ?? null,
    views: raw.views ?? null,
    chaptersCount: raw.chapters
      ? maxBranchChaptersCount(raw.chapters)
      : (raw.chaptersCount ?? null),
    pages: raw.pages ?? null,
    publicUrl: raw.publicUrl,
  };
};

/** Главу без номера сравнивать не с чем — источник его просто не отдаёт, поэтому такие главы
 *  уходят в хвост нумерованных, сохраняя порядок источника (Array.prototype.sort стабилен). */
export const compareChapterNumber = (a: RawChapter, b: RawChapter): number => {
  if (a.number === null) return b.number === null ? 0 : 1;
  if (b.number === null) return -1;
  return a.number - b.number;
};

export const normalizeChapter = (sourceId: string, titleId: string, raw: RawChapter): Chapter => {
  const id = `${sourceId}:${encodeChapterId({ id: raw.id, url: raw.url, branch: raw.branch })}`;
  return {
    id,
    titleId,
    number: raw.number,
    volume: raw.volume,
    title: raw.title,
    branch: raw.branch,
    scanlator: raw.scanlator,
    uploadedAt: raw.uploadDate > 0 ? toServerDateTime(raw.uploadDate) : null,
    // Внутренний относительный url источника наружу не отдаётся (см. contracts/chapter.ts) —
    // клиенту для навигации достаточно непрозрачного id.
    url: id,
  };
};

export const normalizePage = (
  env: Pick<Env, 'IMG_SIGN_SECRET'>,
  sourceId: string,
  index: number,
  raw: RawPage,
): Page => {
  return {
    index,
    url: buildSignedImageUrl(env.IMG_SIGN_SECRET, sourceId, raw.url),
    width: null,
    height: null,
  };
};

type BranchGroup = {
  key: string | null;
  items: RawChapter[];
};

const groupByBranch = (chapters: RawChapter[]): BranchGroup[] => {
  const groups = new Map<string | null, RawChapter[]>();
  for (const chapter of chapters) {
    const list = groups.get(chapter.branch) ?? [];
    list.push(chapter);
    groups.set(chapter.branch, list);
  }

  return Array.from(groups.entries())
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => {
      const freshnessA = Math.max(0, ...a.items.map((chapter) => chapter.uploadDate));
      const freshnessB = Math.max(0, ...b.items.map((chapter) => chapter.uploadDate));
      return b.items.length - a.items.length || freshnessB - freshnessA;
    });
};

/** Источник без веток помечает главы `branch: null` — наружу такая ветка уходит под
 *  синтетическим id, который listChapters разворачивает обратно через toBranchKey. */
export const DEFAULT_BRANCH_ID = 'default';

export const toBranchKey = (branchId: string): string | null => {
  return branchId === DEFAULT_BRANCH_ID ? null : branchId;
};

export const computeBranches = (chapters: RawChapter[]): Branch[] => {
  return groupByBranch(chapters).map(({ key, items }) => {
    const freshness = Math.max(0, ...items.map((chapter) => chapter.uploadDate));
    return {
      id: key ?? DEFAULT_BRANCH_ID,
      name: key,
      scanlator: items[0]?.scanlator ?? null,
      chaptersCount: items.length,
      lastUpdatedAt: freshness > 0 ? toServerDateTime(freshness) : null,
    };
  });
};

/** Ветка по умолчанию — самая полная и свежая (doc04, правило 2). */
export const pickDefaultBranch = (chapters: RawChapter[]): string | null => {
  return groupByBranch(chapters)[0]?.key ?? null;
};

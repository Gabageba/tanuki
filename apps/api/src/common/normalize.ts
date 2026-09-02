import {
  CONTENT_RATING,
  type Branch,
  type Chapter,
  type FilterGroup,
  type FilterOption,
  type Manga,
  type Page,
  type Tag,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { buildSignedImageUrl } from '../img-proxy/sign.util';
import { IMAGE_FORMAT } from '../img-proxy/models';
import { toServerDateTime } from './dates';
import { encodeChapterId, encodeMangaId } from './opaque-id';
import type {
  RawChapter,
  RawFilterGroup,
  RawFilterOption,
  RawManga,
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
  };
};

export const mangaIdOf = (sourceId: string, raw: Pick<RawManga, 'id' | 'url'>): string => {
  return `${sourceId}:${encodeMangaId({ id: raw.id, url: raw.url })}`;
};

export const normalizeManga = (
  env: Pick<Env, 'IMG_SIGN_SECRET'>,
  sourceId: string,
  raw: RawManga,
): Manga => {
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

  return {
    id: mangaIdOf(sourceId, raw),
    sourceId,
    slug: String(raw.id),
    title: raw.title,
    altTitles: raw.altTitles,
    coverUrl,
    largeCoverUrl,
    description: raw.description,
    authors: raw.authors,
    tags: raw.tags.map(normalizeTag),
    state: raw.state,
    restriction: raw.restriction ?? null,
    contentRating: raw.contentRating ?? CONTENT_RATING.SAFE,
    type: raw.type ?? null,
    year: raw.year ?? null,
    // raw.rating is normalized to 0..1 by every parser (see RawManga in @tanuki/parsers) —
    // scale it up to the 0..10 the API exposes, rounded to 2 decimals to shake off float noise
    // from the division parsers do to reach 0..1 in the first place.
    rating: raw.rating >= 0 ? Math.round(raw.rating * 1000) / 100 : null,
    likes: raw.likes ?? null,
    chaptersCount: raw.chapters?.length ?? raw.chaptersCount ?? null,
    publicUrl: raw.publicUrl,
  };
};

export const normalizeChapter = (sourceId: string, mangaId: string, raw: RawChapter): Chapter => {
  const id = `${sourceId}:${encodeChapterId({ id: raw.id, url: raw.url, branch: raw.branch })}`;
  return {
    id,
    mangaId,
    number: raw.number > 0 ? raw.number : null,
    volume: raw.volume > 0 ? raw.volume : null,
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

export const computeBranches = (chapters: RawChapter[]): Branch[] => {
  return groupByBranch(chapters).map(({ key, items }) => {
    const freshness = Math.max(0, ...items.map((chapter) => chapter.uploadDate));
    return {
      id: key ?? 'default',
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

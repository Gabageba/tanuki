/**
 * Wire shapes returned by parsers. Mirrors what the Kotlin sidecar used to serialize from
 * kotatsu's Manga/MangaChapter/MangaPage domain objects — apps/api/src/common/normalize.ts
 * depends on these exact sentinel conventions and must not change when this package does:
 *
 * - rating: -1 = unknown, else a float already scaled to 0..1 (not 0..10).
 * - number / volume: 0 = unknown.
 * - uploadDate: epoch MILLISECONDS, 0 = unknown.
 * - branch: null allowed on both Manga-less list items and chapters.
 * - coverUrl: null allowed (normalize.ts turns it into '').
 * - id (RawManga, RawChapter): stable across process restarts — see core/uid.ts.
 */

export const RATING_UNKNOWN = -1;

export type RawContentRating = 'SAFE' | 'SUGGESTIVE' | 'ADULT';

export type RawMangaState =
  'ONGOING' | 'FINISHED' | 'ABANDONED' | 'PAUSED' | 'UPCOMING' | 'RESTRICTED';

export interface RawTag {
  title: string;
  key: string;
  source: string;
}

export interface RawManga {
  id: number;
  title: string;
  altTitles: string[];
  url: string;
  publicUrl: string;
  rating: number;
  contentRating: RawContentRating | null;
  coverUrl: string | null;
  tags: RawTag[];
  state: RawMangaState | null;
  authors: string[];
  largeCoverUrl: string | null;
  description: string | null;
  /** null on list items, populated (possibly []) on getDetails. */
  chapters: RawChapter[] | null;
  source: string;
}

export interface RawChapter {
  id: number;
  title: string | null;
  number: number;
  volume: number;
  url: string;
  scanlator: string | null;
  uploadDate: number;
  branch: string | null;
  source: string;
}

export interface RawPage {
  id: number;
  /** Absolute, pre-resolved — getPages() must not return lazy/relative page handles. */
  url: string;
  preview: string | null;
  source: string;
}

export interface RawSourceInfo {
  id: string;
  title: string;
  locale: string;
  contentType: string;
  isBroken: boolean;
  sortOrders: string[];
  isSearchSupported: boolean;
  isMultipleTagsSupported: boolean;
}

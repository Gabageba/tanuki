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

import type {
  ContentRating,
  FilterGroupSettings,
  FilterType,
  MangaRestriction,
  MangaState,
  MangaType,
  SortOrder,
  SourceContentType,
} from '@tanuki/contracts';

export const RATING_UNKNOWN = -1;

export type RawContentRating = ContentRating;
export type RawMangaType = MangaType;

export type RawTag = {
  title: string;
  key: string;
  source: string;
};

export type RawManga = {
  id: number;
  title: string;
  altTitles: string[];
  url: string;
  publicUrl: string;
  rating: number;
  contentRating: RawContentRating | null;
  coverUrl: string | null;
  tags: RawTag[];
  state: MangaState | null;
  authors: string[];
  largeCoverUrl: string | null;
  description: string | null;
  /** null on list items, populated (possibly []) on getDetails. */
  chapters: RawChapter[] | null;
  source: string;
  /** Publication format. Omitted where the source page being parsed doesn't expose it. */
  type?: RawMangaType | null;
  /** Publication year. Omitted where the source page being parsed doesn't expose it. */
  year?: number | null;
  /** Chapter total as reported by the source itself, for list items whose page doesn't carry
   *  the full chapter list (`chapters` stays null there). Falls back to `chapters.length` in
   *  normalize.ts, so details-page parsing doesn't need to set this too. */
  chaptersCount?: number | null;
  /** Unbounded "likes"/"favorites" counter some sources expose instead of a real 0..10 rating
   *  (e.g. the chan-engine DLE sites' "Плюсиков: N"). Distinct from `rating` — it has no fixed
   *  ceiling, so it can't be normalized onto the 0..10 scale. Omitted where the source has no
   *  such counter. */
  likes?: number | null;
  /** Total page count of the title itself, for sources whose catalog entry is a single release
   *  (a oneshot or gallery) rather than a series split into chapters — distinct from a chapter's
   *  own page list (RawPage). Omitted where the source has no such counter. */
  pages?: number | null;
  /** Why the source won't hand over the chapters (geo-block, takedown, paywall) — independent of
   *  `state`, which is about publication, not access. Omitted where the source doesn't restrict
   *  this title. */
  restriction?: MangaRestriction | null;
};

export type RawChapter = {
  id: number;
  title: string | null;
  number: number;
  volume: number;
  url: string;
  scanlator: string | null;
  uploadDate: number;
  branch: string | null;
  source: string;
};

export type RawPage = {
  id: number;
  /** Absolute, pre-resolved — getPages() must not return lazy/relative page handles. */
  url: string;
  preview: string | null;
  source: string;
};

export type RawFilterOption = {
  /** Opaque value the parser understands — round-trips back via ListParams.filters unchanged. */
  key: string;
  title: string;
  /** Titles matching this option on the source, if it advertises one. */
  count: number | null;
  /** See FilterOption.excludable in @tanuki/contracts. */
  excludable?: boolean;
};

export type RawFilterGroup = {
  /** Stable within one source — e.g. "genre", "status" — namespaces FilterSelection.groupId. */
  id: string;
  title: string;
  /** Selection semantics + widget in one field — see FILTER_TYPE. */
  type: FilterType;
  /** Empty for RANGE groups — their selectable bounds go in `settings` instead. */
  options: RawFilterOption[];
  /** RANGE groups only — the source's own min/max, e.g. a 0..10 rating or 1950..thisYear, plus
   *  any quick-pick presets. */
  settings?: FilterGroupSettings;
  /** Groups sharing this tag are alternative browsing routes on the source, not combinable —
   *  see FilterGroup.exclusiveGroup in @tanuki/contracts. */
  exclusiveGroup?: string;
};

export type RawSourceInfo = {
  id: string;
  title: string;
  /** Host the parser is configured against — SOURCE_CATALOG[id].domains[0], no scheme. */
  domain: string;
  locale: string;
  contentType: SourceContentType;
  isBroken: boolean;
  isAdult: boolean;
  requiresVpn: boolean;
  sortOrders: SortOrder[];
  /** True when the source actually reverses order for the chosen SortOrder — see ListParams.direction. */
  supportsDirection: boolean;
  isSearchSupported: boolean;
  /** Mirrors whether the parser implements getFilters() — see Parser.getFilters. */
  isFiltersSupported: boolean;
  isMultipleTagsSupported: boolean;
};

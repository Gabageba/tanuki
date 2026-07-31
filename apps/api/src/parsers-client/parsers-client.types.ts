// Зеркалит реальные поля data-классов kotatsu-parsers-redo (Manga/MangaChapter/MangaPage/
// MangaTag), как их сериализует Jackson в apps/parsers. Без нормализации — это её вход,
// не выход. См. docs/03-parsers.md: "без переименований".

export interface RawTag {
  title: string;
  key: string;
  source: string;
}

export type RawContentRating = 'SAFE' | 'SUGGESTIVE' | 'ADULT';

export type RawMangaState =
  'ONGOING' | 'FINISHED' | 'ABANDONED' | 'PAUSED' | 'UPCOMING' | 'RESTRICTED';

export interface RawManga {
  id: number;
  title: string;
  altTitles: string[];
  url: string;
  publicUrl: string;
  rating: number; // -1 = неизвестен (RATING_UNKNOWN)
  contentRating: RawContentRating | null;
  coverUrl: string | null;
  tags: RawTag[];
  state: RawMangaState | null;
  authors: string[];
  largeCoverUrl: string | null;
  description: string | null;
  chapters: RawChapter[] | null;
  source: string;
}

export interface RawChapter {
  id: number;
  title: string | null;
  number: number; // 0 = неизвестен
  volume: number; // 0 = неизвестен
  url: string;
  scanlator: string | null;
  uploadDate: number; // epoch millis, 0 = неизвестна
  branch: string | null;
  source: string;
}

export interface RawPage {
  id: number;
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

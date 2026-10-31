export type MangaJson = {
  id: string;
  slug: string;
  title: string;
  titleEnglish?: string;
  alternateTitles?: string[];
  coverUrl?: string;
  imageUrl?: string;
  genres?: string[];
  statusTitle?: string;
  translationStatus?: string;
  authors?: string[];
  artists?: string[];
  publishers?: string[];
  isAdult?: boolean;
  description?: string;
  teams?: { name?: string }[];
  year?: number;
  type?: string;
  pegiRating?: string;
  likes?: number;
  views?: number;
  createdAt?: string;
};

export type WaMangaTokens = {
  access_token: string;
  refresh_token: string;
};

/** /user/library: flat rows used by the site's own library and CSV export. */
export type WaMangaLibraryEntry = {
  mangaId: string;
  slug: string;
  title: string;
  type: string;
  coverUrl: string | null;
  status: string | null;
  favorite: boolean;
  chapterPosition: string | number | null;
};

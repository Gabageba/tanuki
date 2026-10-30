export type ChapterJson = {
  _id?: string;
  isPublished?: boolean;
  chapterNumber?: number;
  name?: string | null;
  releaseDate?: string | null;
  createdAt?: string | null;
};

export type MangaJson = {
  _id?: string;
  slug?: string;
  name?: string;
  coverImage?: string;
  genres?: string[];
  tags?: string[];
  author?: string;
  artist?: string;
  altNames?: string[];
  averageRating?: number;
  isAdult?: boolean;
  ageLimit?: number;
  status?: string;
  type?: string;
  releaseYear?: number;
  totalChapters?: number;
  totalRatings?: number;
  views?: number;
  createdAt?: string | null;
  description?: string;
  chapters?: ChapterJson[];
};

export type TomiloLibResponse<T> = { success?: boolean; data?: T };

export type TomiloLibTokens = { access_token: string; refresh_token: string };

export type TomiloLibBookmark = {
  titleId: string | MangaJson | null;
  title?: MangaJson;
  category?: string;
};

export type TomiloLibProfile = {
  bookmarks?: (TomiloLibBookmark | string)[];
};

export type TomiloLibBookmarkGroup = { id: string; name: string };

export type TomiloLibHistory = {
  titleId: string | { _id: string };
  chapters?: { chapterNumber?: number | null }[];
  lastChapter?: { chapterNumber?: number | null } | null;
};

export type TomiloLibHistoryPage = TomiloLibResponse<
  TomiloLibHistory[] | { items: TomiloLibHistory[]; pagination?: { pages?: number } }
> & { pagination?: { pages?: number } };

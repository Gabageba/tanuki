export type CoverJson = {
  mid?: string;
  high?: string;
};

export type TagJson = {
  id: number;
  name: string;
};

export type StatusJson = {
  id?: number;
};

export type AgeLimitJson = {
  id?: number;
};

export type TypeJson = {
  id?: number;
};

/** `creators[].type` — see CREATOR_TYPE below for what each id means. */
export type CreatorJson = {
  name: string;
  type?: number;
};

export type PublisherJson = {
  name?: string;
};

export type BranchJson = {
  id: number;
  publishers?: PublisherJson[];
};

export type MangaJson = {
  dir: string;
  main_name: string;
  secondary_name?: string;
  another_name?: string;
  /** Числом в каталоге, строкой («7.5») в слайдерах главной. */
  avg_rating?: number | string;
  cover: CoverJson;
  type?: TypeJson;
  status?: StatusJson;
  /** Status of remanga's own translation, distinct from `status` (the original's release). */
  translate_status?: StatusJson;
  age_limit?: AgeLimitJson;
  issue_year?: number;
  genres?: TagJson[];
  /** Narrower trope/setting tags shown alongside `genres` on the source itself (e.g.
   *  «Средневековье», «Исекай», «ГГ мужчина») — a second, more specific vocabulary, not a subset
   *  of genres. */
  categories?: TagJson[];
  description?: string;
  /** Original work's writer/artist/publisher credits — absent on list items, only `getDetails`
   *  requests carry it. */
  creators?: CreatorJson[];
  /** Vote count backing `avg_rating` — only present on `getDetails`, unlike `total_votes`/
   *  `total_views` below which the list endpoint already carries. */
  count_rating?: number;
  /** Unbounded "likes" counter, distinct from the 0..10 `avg_rating`. */
  total_votes?: number;
  total_views?: number;
  branches?: BranchJson[];
  detail?: { message?: string };
};

export type ChapterJson = {
  id: number;
  /** API отдаёт номер строкой («205.1»), а в старых ответах встречается и числом. */
  chapter?: number | string;
  tome?: number | string;
  name?: string;
  upload_date?: string;
  is_paid?: boolean;
  is_bought?: boolean;
  publishers?: PublisherJson[];
};

export type PageJson = {
  link: string;
};

export type DictionaryJson = {
  id: number;
  name: string;
};

export type RemangaBookmarkFolderJson = {
  id: number;
  type: number;
  name: string;
};

export type RemangaBookmarkJson = {
  title: MangaJson | null;
};

export type RemangaPageJson<T> = {
  results: T[];
  next?: string | null;
};

export type RemangaViewer = { id: number; username: string };

/** Ответ формы входа ReManga: токен или требование двухфакторной проверки. */
export type RemangaLoginJson = {
  content?: { access_token?: string; two_factor_auth?: boolean };
};

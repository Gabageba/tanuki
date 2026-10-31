/** Catalog identifiers include the Directus id and the public slug. */
export const URL_DELIMITER = ',,';

/** Public Directus API used by the source's frontend (CSP connect-src). */
export const API_BASE = 'https://backend.hentaichan.cc';

export const HENTAICHAN_CC_SESSION_COOKIE = '__Secure-better-auth.session_token';

export const PROFILE_ACTION = {
  LIKES: 'getProfileLikes',
  HISTORY: 'getProfileHistory',
} as const;

export type ProfileManga = {
  id: number;
  name: string;
  slug: string;
  src: string | null;
};

export type ProfilePage = {
  count: number;
  manga: ProfileManga[];
};

export type HentaichanViewer = { id: string; name: string };

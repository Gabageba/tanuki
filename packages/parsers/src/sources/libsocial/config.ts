/**
 * OAuth2 Authorization Code + PKCE endpoints for one LibSocial network member's branded auth
 * gateway (reverse-engineered from HentaiLib's live traffic — auth.hentaicdn.org / SSO). Each
 * network member has its own gateway/client, so this is per-source, not shared like siteId.
 */
export type LibSocialAuthConfig = {
  /** e.g. https://auth.hentaicdn.org — hosts /auth/login and /auth/oauth/authorize. */
  authOrigin: string;
  /** e.g. https://hapi.hentaicdn.org/api/auth/oauth/token — the code/refresh_token exchange. */
  tokenUrl: string;
  clientId: string;
  /** Must exactly match a redirect_uri already whitelisted for clientId — the site's own
   *  frontend route works fine here, we never rely on it actually being reachable by us,
   *  only on the browser's address bar carrying the `code` query param once it lands there. */
  redirectUri: string;
};

export type LibSocialConfig = {
  id: string;
  /** cdnlibs.org `Site-Id` header value — the API is shared across the whole LibSocial network. */
  siteId: number;
  isNsfw: boolean;
  /** MANGALIB remaps a 404 on chapter pages to "auth required" (site gates some chapters). */
  authRequiredOnMissingPages?: boolean;
  /** Present only for sources with a reverse-engineered login flow (see auth.ts + scripts/). */
  auth?: LibSocialAuthConfig;
};

export const LIBSOCIAL_API_HOST = 'api.cdnlibs.org';

// title/domains live in SOURCE_CATALOG (../catalog) — look them up by id, don't duplicate here.
export const LIBSOCIAL_CONFIGS: LibSocialConfig[] = [
  {
    id: 'MANGALIB',
    siteId: 1,
    isNsfw: false,
    authRequiredOnMissingPages: true,
  },
  {
    id: 'HENTAILIB',
    siteId: 4,
    isNsfw: true,
    // Unlike MANGALIB, every chapter's pages endpoint 404s site-wide (verified against both
    // a random title and its very first chapter) — the whole source appears to gate page
    // access behind an authenticated session rather than per-chapter. Same remap as MANGALIB
    // so this surfaces as SOURCE_AUTH_REQUIRED instead of tripping the health breaker.
    authRequiredOnMissingPages: true,
    auth: {
      authOrigin: 'https://auth.hentaicdn.org',
      tokenUrl: 'https://hapi.hentaicdn.org/api/auth/oauth/token',
      clientId: '1',
      redirectUri: 'https://hentailib.me/ru/front/auth/oauth/callback',
    },
  },
  {
    id: 'YAOILIB',
    siteId: 2,
    isNsfw: false,
  },
];

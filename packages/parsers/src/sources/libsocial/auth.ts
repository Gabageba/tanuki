import { request as undiciRequest } from 'undici';
import { decodeBytes } from '../../core/html/dom';
import { decompress } from '../../core/http/decompress';
import type { Logger } from '../../core/parser';
import { SourceTokenExpiredError } from '../../errors';
import type { LibSocialAuthConfig } from './config';
import { readTokenStore, writeTokenStore, type LibSocialTokenState } from './token-store';

type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

// Refresh a bit before the cached token actually expires, so a request that starts just under
// the wire doesn't race the real expiry.
const EXPIRY_SAFETY_MARGIN_MS = 5 * 60_000;

// One refresh in flight per token store — Passport rotates and invalidates the refresh_token
// on use, so two concurrent callers hitting an expired token must not each fire their own
// refresh_token grant (the second would be replaying an already-burned token).
const refreshesInFlight = new Map<string, Promise<LibSocialTokenState>>();

/**
 * POSTs directly via undici rather than through the source's own HttpClient — that client's
 * interceptor chain is where the Authorization header this function exists to produce gets
 * attached, so routing the token request through it would recurse back into this function.
 */
const requestToken = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  body: Record<string, string>,
  label: string,
): Promise<LibSocialTokenState> => {
  const origin = new URL(auth.redirectUri).origin;
  let res;
  try {
    res = await undiciRequest(auth.tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'site-id': String(siteId),
        origin,
        referer: `${origin}/`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new SourceTokenExpiredError(
      `${label}: token endpoint unreachable (${err instanceof Error ? err.message : String(err)})`,
      label,
    );
  }

  const rawBytes = Buffer.from(await res.body.arrayBuffer());
  const contentEncoding = Array.isArray(res.headers['content-encoding'])
    ? res.headers['content-encoding'][0]
    : res.headers['content-encoding'];
  const contentType = Array.isArray(res.headers['content-type'])
    ? res.headers['content-type'][0]
    : res.headers['content-type'];
  const text = decodeBytes(decompress(rawBytes, contentEncoding), contentType);

  if (res.statusCode >= 400) {
    throw new SourceTokenExpiredError(
      `${label}: token request rejected (HTTP ${res.statusCode}) — refresh_token likely expired or was revoked, run 'pnpm --filter @tanuki/parsers login:libsocial ${label}' again`,
      label,
    );
  }

  let json: TokenResponse;
  try {
    json = JSON.parse(text) as TokenResponse;
  } catch {
    throw new SourceTokenExpiredError(
      `${label}: token endpoint returned a non-JSON response`,
      label,
    );
  }
  if (!json.access_token || !json.refresh_token) {
    throw new SourceTokenExpiredError(
      `${label}: token response missing access_token/refresh_token`,
      label,
    );
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
};

const refreshAndPersist = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  tokenStorePath: string,
  refreshToken: string,
  label: string,
  logger: Logger,
): Promise<LibSocialTokenState> => {
  const state = await requestToken(
    auth,
    siteId,
    { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: auth.clientId },
    label,
  );
  await writeTokenStore(tokenStorePath, state);
  logger.info(
    `${label}: refreshed LibSocial OAuth token, valid until ${new Date(state.expiresAt).toISOString()}`,
  );
  return state;
};

/**
 * Returns a currently-valid access token for Authorization: Bearer, transparently refreshing
 * (and persisting the rotated refresh_token back to disk) when the cached one is close to
 * expiry. Throws SourceTokenExpiredError — with an actionable message pointing at the
 * Playwright login script — when there's no token store yet, or the stored refresh_token was
 * rejected. Neither case is recoverable in-process: only a human can clear the site's reCAPTCHA.
 */
export const getValidAccessToken = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  tokenStorePath: string,
  label: string,
  logger: Logger,
): Promise<string> => {
  const stored = await readTokenStore(tokenStorePath);
  if (!stored) {
    throw new SourceTokenExpiredError(
      `${label}: not authenticated — run 'pnpm --filter @tanuki/parsers login:libsocial ${label}' once`,
      label,
    );
  }
  if (stored.expiresAt - Date.now() > EXPIRY_SAFETY_MARGIN_MS) {
    return stored.accessToken;
  }

  const inFlight = refreshesInFlight.get(tokenStorePath);
  if (inFlight) return (await inFlight).accessToken;

  const promise = refreshAndPersist(
    auth,
    siteId,
    tokenStorePath,
    stored.refreshToken,
    label,
    logger,
  );
  refreshesInFlight.set(tokenStorePath, promise);
  try {
    const fresh = await promise;
    return fresh.accessToken;
  } finally {
    refreshesInFlight.delete(tokenStorePath);
  }
};

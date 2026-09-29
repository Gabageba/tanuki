import { createHash, randomBytes } from 'node:crypto';
import { request as undiciRequest } from 'undici';
import { decodeBytes } from '../../core/html/dom';
import { decompress } from '../../core/http/decompress';
import type { GroupleCredentials, Logger } from '../../core/parser';
import { SourceTokenExpiredError } from '../../errors';
import type { LibSocialAuthConfig } from './config';
import type { LibSocialTokenState, TokenStore } from '../../core/source-accounts';

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

/** Вход заново логином и паролем; null — сайт их не принял. */
export type LibSocialRelogin = (
  credentials: GroupleCredentials,
) => Promise<LibSocialTokenState | null>;

const refreshAndPersist = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  store: TokenStore,
  refreshToken: string,
  label: string,
  logger: Logger,
  relogin: LibSocialRelogin | undefined,
): Promise<LibSocialTokenState> => {
  let state: LibSocialTokenState;
  try {
    state = await requestToken(
      auth,
      siteId,
      { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: auth.clientId },
      label,
    );
  } catch (err) {
    // refresh_token отвергнут — с сохранённым паролем входим заново, как сделал бы человек.
    if (!store.credentials || !relogin) throw err;
    logger.warn(`${label}: refresh_token rejected, logging in again with the saved password`);
    const fresh = await relogin(store.credentials).catch(() => null);
    if (!fresh) throw err;
    state = fresh;
  }
  await store.write(state);
  logger.info(
    `${label}: refreshed LibSocial OAuth token, valid until ${new Date(state.expiresAt).toISOString()}`,
  );
  return state;
};

/**
 * Returns a currently-valid access token for Authorization: Bearer, transparently refreshing
 * (and persisting the rotated refresh_token back to disk) when the cached one is close to
 * expiry. A rejected refresh_token is recovered by `relogin` when the store carries a saved
 * password. Otherwise throws SourceTokenExpiredError — with an actionable message pointing at
 * the login script — when there's no token store yet, or the stored refresh_token was rejected.
 */
export const getValidAccessToken = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  store: TokenStore,
  label: string,
  logger: Logger,
  relogin?: LibSocialRelogin,
): Promise<string> => {
  const stored = await store.read();
  if (!stored) {
    throw new SourceTokenExpiredError(
      `${label}: not authenticated — run 'pnpm --filter @tanuki/parsers login:libsocial ${label}' once`,
      label,
    );
  }
  if (stored.expiresAt - Date.now() > EXPIRY_SAFETY_MARGIN_MS) {
    return stored.accessToken;
  }

  const inFlight = refreshesInFlight.get(store.key);
  if (inFlight) return (await inFlight).accessToken;

  const promise = refreshAndPersist(
    auth,
    siteId,
    store,
    stored.refreshToken,
    label,
    logger,
    relogin,
  );
  refreshesInFlight.set(store.key, promise);
  try {
    const fresh = await promise;
    return fresh.accessToken;
  } finally {
    refreshesInFlight.delete(store.key);
  }
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Ищет объект с refresh_token на любой глубине — форма ключа `auth` у сайта не документирована. */
const findTokenObject = (value: unknown, depth = 0): UnknownRecord | null => {
  if (!isRecord(value) || depth > 4) return null;
  if (typeof value.refresh_token === 'string') return value;
  for (const nested of Object.values(value)) {
    const found = findTokenObject(nested, depth + 1);
    if (found) return found;
  }
  return null;
};

/**
 * Разбирает то, что человек скопировал из localStorage сайта (ключ `auth`) или сам refresh_token.
 * Срок access_token берётся из expires_in + timestamp, если они есть; иначе токен считается
 * истёкшим и при первом же запросе обменивается по refresh_token.
 */
export const parseLibSocialAuthValue = (raw: string): LibSocialTokenState | null => {
  const value = raw.trim();
  if (!value) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    // Не JSON — считаем, что вставлен голый refresh_token.
    return /^[\w.-]{20,}$/.test(value)
      ? { accessToken: '', refreshToken: value, expiresAt: 0 }
      : null;
  }

  const token = findTokenObject(parsed);
  if (!token || typeof token.refresh_token !== 'string') return null;
  const accessToken = typeof token.access_token === 'string' ? token.access_token : '';
  const expiresIn = typeof token.expires_in === 'number' ? token.expires_in : null;
  const issuedAt = typeof token.timestamp === 'number' ? token.timestamp : null;

  return {
    accessToken,
    refreshToken: token.refresh_token,
    expiresAt: accessToken && expiresIn && issuedAt ? issuedAt + expiresIn * 1000 : 0,
  };
};

type AuthMeResponse = { data?: { id?: number; username?: string } };

/**
 * Проверяет токен запросом профиля и возвращает имя аккаунта. Токен при этом может смениться
 * (истёкший access_token обменивается по refresh_token) — актуальный уходит в store.
 */
export const fetchLibSocialAccountName = async (
  auth: LibSocialAuthConfig,
  siteId: number,
  store: TokenStore,
  label: string,
  logger: Logger,
  apiHost: string,
): Promise<string | null> => {
  const accessToken = await getValidAccessToken(auth, siteId, store, label, logger);
  const origin = new URL(auth.redirectUri).origin;
  const res = await undiciRequest(`https://${apiHost}/api/auth/me`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'site-id': String(siteId),
      referer: `${origin}/`,
      accept: 'application/json',
    },
  });
  const rawBytes = Buffer.from(await res.body.arrayBuffer());
  if (res.statusCode !== 200) return null;
  const contentEncoding = Array.isArray(res.headers['content-encoding'])
    ? res.headers['content-encoding'][0]
    : res.headers['content-encoding'];
  try {
    const json = JSON.parse(
      decodeBytes(decompress(rawBytes, contentEncoding), 'application/json'),
    ) as AuthMeResponse;
    return json.data?.username ?? String(json.data?.id ?? '');
  } catch {
    return null;
  }
};

/**
 * Один вход через страницу авторизации сайта (OAuth2 Authorization Code + PKCE): ссылка, по
 * которой человек входит, разбор адреса, на который сайт вернёт браузер, и обмен кода на
 * токены. Пара токенов получается своя — не та, что у вкладки сайта в браузере человека.
 */
export type LibSocialAuthorization = {
  authorizeUrl: string;
  /**
   * Код из адреса, если браузер вернулся на callback сайта, иначе null. Бросает, если сайт
   * вернул ошибку авторизации или чужой state.
   */
  readCallback(url: string): string | null;
  exchange(code: string): Promise<LibSocialTokenState>;
};

export const createLibSocialAuthorization = (
  auth: LibSocialAuthConfig,
  siteId: number,
  label: string,
): LibSocialAuthorization => {
  const codeVerifier = randomBytes(64).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const state = randomBytes(24).toString('base64url');
  const redirect = new URL(auth.redirectUri);

  const authorizeUrl = new URL(`${auth.authOrigin}/auth/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', auth.clientId);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('iframe', 'false');
  authorizeUrl.searchParams.set('prompt', 'consent');
  authorizeUrl.searchParams.set('redirect_uri', auth.redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', '');
  authorizeUrl.searchParams.set('state', state);

  return {
    authorizeUrl: authorizeUrl.toString(),
    readCallback(url) {
      const parsed = new URL(url);
      if (parsed.origin !== redirect.origin || parsed.pathname !== redirect.pathname) return null;
      const error = parsed.searchParams.get('error');
      if (error) throw new Error(`${label}: сайт вернул ошибку авторизации: ${error}`);
      const code = parsed.searchParams.get('code');
      if (!code) return null;
      if (parsed.searchParams.get('state') !== state) {
        throw new Error(`${label}: state в ответе не совпадает с отправленным`);
      }
      return code;
    },
    exchange: (code) =>
      requestToken(
        auth,
        siteId,
        {
          grant_type: 'authorization_code',
          client_id: auth.clientId,
          redirect_uri: auth.redirectUri,
          code_verifier: codeVerifier,
          code,
        },
        label,
      ),
  };
};

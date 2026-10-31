import type { CookieJar } from 'tough-cookie';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { GroupleCredentials, ParserContext } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';
import { classifyResponse, looksLikeAntibotChallenge } from '../../core/http/classify';
import { currentSourceAccount } from '../../core/source-accounts';
import { ParseError, SourceAuthRequiredError, SourceTokenExpiredError } from '../../errors';
import { SOURCE_ID } from '../catalog';
import type { WaMangaTokens } from './models';

// API token pair is kept in the existing encrypted account jar, separate from the guest jar.
const ACCESS_TOKEN = 'wamanga_access_token';
const REFRESH_TOKEN = 'wamanga_refresh_token';
const TOKEN_REGEX = /^[\w.~+/-]{20,}=*$/;
const REFRESHES = new WeakMap<CookieJar, Promise<string>>();

export const saveWaMangaTokens = async (jar: CookieJar, domain: string, tokens: WaMangaTokens) => {
  await jar.setCookie(
    `${ACCESS_TOKEN}=${tokens.access_token}; Path=/; Secure; HttpOnly`,
    `https://${domain}/`,
  );
  await jar.setCookie(
    `${REFRESH_TOKEN}=${tokens.refresh_token}; Path=/; Secure; HttpOnly`,
    `https://${domain}/`,
  );
};

const getToken = async (jar: CookieJar, domain: string, key: string) =>
  (await jar.getCookies(`https://${domain}/`)).find((cookie) => cookie.key === key)?.value;

/** Request names and token fields follow https://wamanga.ru/api/docs-json (2026-10-31). */
const requestTokens = async (
  http: HttpClient,
  domain: string,
  path: string,
  body: Record<string, string>,
  accessToken?: string,
): Promise<WaMangaTokens | null> => {
  const res = await http.request({
    method: 'POST',
    url: `https://${domain}/api/v1/auth/${path}`,
    headers: {
      'content-type': 'application/json',
      Origin: `https://${domain}`,
      Referer: `https://${domain}/`,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (
    !looksLikeAntibotChallenge(res.status, res.headers, res.text()) &&
    (res.status === 401 || res.status === 403 || res.status === 404)
  )
    return null;
  const error = classifyResponse(SOURCE_ID.WAMANGA, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  const tokens = res.json<WaMangaTokens>();
  if (
    typeof tokens?.access_token !== 'string' ||
    !TOKEN_REGEX.test(tokens.access_token) ||
    typeof tokens.refresh_token !== 'string' ||
    !TOKEN_REGEX.test(tokens.refresh_token)
  )
    throw new ParseError('WaManga token response is malformed', SOURCE_ID.WAMANGA);
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
};

export const loginWaManga = (http: HttpClient, domain: string, credentials: GroupleCredentials) =>
  requestTokens(http, domain, 'login', {
    username: credentials.username,
    password: credentials.password,
  });

const fetchAccountJson = async <T>(ctx: ParserContext, token: string, path: string): Promise<T> => {
  const res = await ctx.http.request({
    method: 'GET',
    url: `https://${ctx.domain}/api/v1${path}`,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (
    (res.status === 401 || res.status === 403) &&
    !looksLikeAntibotChallenge(res.status, res.headers, res.text())
  )
    throw new SourceTokenExpiredError('WaManga session expired', SOURCE_ID.WAMANGA);
  const error = classifyResponse(SOURCE_ID.WAMANGA, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  return res.json<T>();
};

export const fetchWaMangaSessionJson = async <T>(ctx: ParserContext, path: string): Promise<T> => {
  const account = currentSourceAccount(SOURCE_AUTH_FAMILY.WAMANGA);
  const jar = account?.jar;
  if (!jar)
    throw new SourceAuthRequiredError(
      'Bookmarks require the user’s own account',
      SOURCE_ID.WAMANGA,
    );
  const token = await getToken(jar, ctx.domain, ACCESS_TOKEN);
  try {
    if (!token) throw new SourceTokenExpiredError('WaManga session is missing', SOURCE_ID.WAMANGA);
    return await fetchAccountJson<T>(ctx, token, path);
  } catch (error) {
    if (!(error instanceof SourceTokenExpiredError)) throw error;
    let refreshed = await getToken(jar, ctx.domain, ACCESS_TOKEN);
    if (!refreshed || refreshed === token) {
      let pending = REFRESHES.get(jar);
      if (!pending) {
        pending = (async () => {
          try {
            const refreshToken = await getToken(jar, ctx.domain, REFRESH_TOKEN);
            let tokens = refreshToken
              ? await requestTokens(ctx.http, ctx.domain, 'refresh', { token: refreshToken }, token)
              : null;
            if (!tokens && account.credentials)
              tokens = await loginWaManga(ctx.http, ctx.domain, account.credentials);
            if (!tokens)
              throw new SourceTokenExpiredError('WaManga session expired', SOURCE_ID.WAMANGA);
            await saveWaMangaTokens(jar, ctx.domain, tokens);
            account.onChange?.();
            return tokens.access_token;
          } finally {
            REFRESHES.delete(jar);
          }
        })();
        REFRESHES.set(jar, pending);
      }
      refreshed = await pending;
    }
    return fetchAccountJson<T>(ctx, refreshed, path);
  }
};

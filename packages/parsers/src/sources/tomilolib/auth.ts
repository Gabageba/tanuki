import type { CookieJar } from 'tough-cookie';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { GroupleCredentials, ParserContext } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';
import { classifyResponse } from '../../core/http/classify';
import { currentSourceAccount } from '../../core/source-accounts';
import { ParseError, SourceAuthRequiredError, SourceTokenExpiredError } from '../../errors';
import { SOURCE_ID } from '../catalog';
import type { TomiloLibResponse, TomiloLibTokens } from './models';

// В браузере сайта токены лежат в localStorage; jar позволяет хранить их существующим
// зашифрованным хранилищем аккаунтов tanuki. Формат API — из клиента TomiloLib (2026-10-30).
const ACCESS_TOKEN = 'tomilo_lib_token';
const REFRESH_TOKEN = 'tomilo_lib_refresh_token';
const TOKEN_REGEX = /^[\w.~+/-]{20,}=*$/;
const REFRESHES = new WeakMap<CookieJar, Promise<string>>();

export const saveTomiloLibTokens = async (
  jar: CookieJar,
  domain: string,
  tokens: TomiloLibTokens,
) => {
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

const requestTokens = async (
  http: HttpClient,
  domain: string,
  path: string,
  body: Record<string, string>,
): Promise<TomiloLibTokens | null> => {
  const res = await http.request({
    method: 'POST',
    url: `https://${domain}/api/auth/${path}`,
    headers: {
      'content-type': 'application/json',
      Origin: `https://${domain}`,
      Referer: `https://${domain}/`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) return null;
  const error = classifyResponse(SOURCE_ID.TOMILOLIB, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  const json = res.json<TomiloLibResponse<TomiloLibTokens> & Partial<TomiloLibTokens>>();
  const tokens = json.data ?? json;
  if (
    json.success === false ||
    typeof tokens.access_token !== 'string' ||
    !TOKEN_REGEX.test(tokens.access_token) ||
    typeof tokens.refresh_token !== 'string' ||
    !TOKEN_REGEX.test(tokens.refresh_token)
  ) {
    throw new ParseError('TomiloLib token response is malformed', SOURCE_ID.TOMILOLIB);
  }
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
};

export const loginTomiloLib = (http: HttpClient, domain: string, credentials: GroupleCredentials) =>
  requestTokens(http, domain, 'login', {
    email: credentials.username,
    password: credentials.password,
  });

const fetchAccountJson = async <T>(ctx: ParserContext, token: string, path: string): Promise<T> => {
  const res = await ctx.http.request({
    method: 'GET',
    url: `https://${ctx.domain}/api${path}`,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401)
    throw new SourceTokenExpiredError('TomiloLib session expired', SOURCE_ID.TOMILOLIB);
  const error = classifyResponse(SOURCE_ID.TOMILOLIB, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  const json = res.json<T & { success?: boolean }>();
  if (json?.success === false)
    throw new ParseError('TomiloLib account request failed', SOURCE_ID.TOMILOLIB);
  return json;
};

/** Только личная сессия; её обновление сохраняется через onChange, как у остальных источников. */
export const fetchTomiloLibSessionJson = async <T>(
  ctx: ParserContext,
  path: string,
): Promise<T> => {
  const account = currentSourceAccount(SOURCE_AUTH_FAMILY.TOMILOLIB);
  const jar = account?.jar;
  if (!jar)
    throw new SourceAuthRequiredError(
      'Bookmarks require the user’s own account',
      SOURCE_ID.TOMILOLIB,
    );
  const token = await getToken(jar, ctx.domain, ACCESS_TOKEN);
  try {
    if (!token)
      throw new SourceTokenExpiredError('TomiloLib session is missing', SOURCE_ID.TOMILOLIB);
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
              ? await requestTokens(ctx.http, ctx.domain, 'refresh', {
                  refresh_token: refreshToken,
                })
              : null;
            if (!tokens && account.credentials)
              tokens = await loginTomiloLib(ctx.http, ctx.domain, account.credentials);
            if (!tokens)
              throw new SourceTokenExpiredError('TomiloLib session expired', SOURCE_ID.TOMILOLIB);
            await saveTomiloLibTokens(jar, ctx.domain, tokens);
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

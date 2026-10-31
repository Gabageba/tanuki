import { CookieJar } from 'tough-cookie';
import type { GroupleCredentials, ParserContext } from '../../core/parser';
import { currentSourceAccount } from '../../core/source-accounts';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { HttpClient } from '../../core/http/client';
import { classifyResponse } from '../../core/http/classify';
import {
  ParseError,
  SourceAuthRequiredError,
  SourceLoginRequiresSessionError,
  SourceTokenExpiredError,
} from '../../errors';
import { SOURCE_ID } from '../catalog';
import type { RemangaLoginJson, RemangaViewer } from './models';

/** Имя cookie и Bearer-заголовок — из публичного клиента remanga.org (2026-10-30). */
export const REMANGA_SESSION_COOKIE = 'auth:token';
const TOKEN_REGEX = /^[\w.~+/-]{20,}=*$/;
const RELOGINS = new WeakMap<CookieJar, Promise<string>>();

export const parseRemangaSessionValue = (value: string): string | null => {
  const text = value.trim();
  const pair = text
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REMANGA_SESSION_COOKIE}=`));
  let token = pair ? pair.slice(REMANGA_SESSION_COOKIE.length + 1) : text;
  try {
    token = decodeURIComponent(token);
  } catch {
    return null;
  }
  return TOKEN_REGEX.test(token) ? token : null;
};

/** Сохраняем токен в общем формате cookie jar — существующее шифрование аккаунтов подходит. */
export const saveRemangaSessionToken = async (jar: CookieJar, domain: string, token: string) => {
  await jar.setCookie(
    `${REMANGA_SESSION_COOKIE}=${token}; Path=/; Secure; HttpOnly`,
    `https://${domain}/`,
  );
};

export const createRemangaSessionJar = async (domain: string, token: string) => {
  const jar = new CookieJar();
  await saveRemangaSessionToken(jar, domain, token);
  return jar;
};

/** Форма сайта отправляет user (логин или почту) и password без обязательной капчи. */
export const loginRemanga = async (
  http: HttpClient,
  domain: string,
  credentials: GroupleCredentials,
): Promise<string | null> => {
  const res = await http.request({
    method: 'POST',
    url: `https://api.${domain}/api/users/login/`,
    headers: {
      'content-type': 'application/json',
      Origin: `https://${domain}`,
      Referer: `https://${domain}/`,
    },
    body: JSON.stringify({ user: credentials.username, password: credentials.password }),
  });
  // Живой отказ на несуществующий тестовый адрес — HTTP 400 с msg (2026-10-30).
  if (res.status === 400 || res.status === 401) return null;
  const error = classifyResponse(SOURCE_ID.REMANGA, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  const json = res.json<RemangaLoginJson>();
  if (json.content?.two_factor_auth) {
    throw new SourceLoginRequiresSessionError(
      'ReManga requires two-factor authentication',
      SOURCE_ID.REMANGA,
    );
  }
  const token = json.content?.access_token;
  if (typeof token !== 'string' || !TOKEN_REGEX.test(token)) {
    throw new ParseError('ReManga login response is missing a token', SOURCE_ID.REMANGA);
  }
  return token;
};

export const getRemangaSessionToken = async (jar: CookieJar, domain: string) =>
  (await jar.getCookies(`https://${domain}/`)).find(({ key }) => key === REMANGA_SESSION_COOKIE)
    ?.value ?? null;

/** Только относительные пути нашего API: адрес из next никогда не получает токен аккаунта. */
export const fetchRemangaAccountJson = async <T>(
  http: HttpClient,
  domain: string,
  token: string,
  path: string,
): Promise<T> => {
  const res = await http.request({
    method: 'GET',
    url: `https://api.${domain}${path}`,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401)
    throw new SourceTokenExpiredError('ReManga session expired', SOURCE_ID.REMANGA);
  const error = classifyResponse(SOURCE_ID.REMANGA, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  return res.json<T>();
};

export const fetchRemangaViewer = async (
  http: HttpClient,
  domain: string,
  token: string,
): Promise<RemangaViewer> => {
  const viewer = await fetchRemangaAccountJson<RemangaViewer>(
    http,
    domain,
    token,
    '/api/v2/users/current/',
  );
  if (!Number.isSafeInteger(viewer.id) || viewer.id <= 0 || typeof viewer.username !== 'string') {
    throw new ParseError('ReManga current user is missing', SOURCE_ID.REMANGA);
  }
  return viewer;
};

/** Запрос от личного аккаунта; сохранённый пароль позволяет один повторный вход при 401. */
export const fetchRemangaSessionJson = async <T>(ctx: ParserContext, path: string): Promise<T> => {
  const account = currentSourceAccount(SOURCE_AUTH_FAMILY.REMANGA);
  const jar = account?.jar;
  if (!jar)
    throw new SourceAuthRequiredError(
      'Bookmarks require the user’s own account',
      SOURCE_ID.REMANGA,
    );
  const token = await getRemangaSessionToken(jar, ctx.domain);
  try {
    if (!token) throw new SourceTokenExpiredError('ReManga session is missing', SOURCE_ID.REMANGA);
    return await fetchRemangaAccountJson<T>(ctx.http, ctx.domain, token, path);
  } catch (error) {
    if (!(error instanceof SourceTokenExpiredError) || !account.credentials) throw error;
    // Параллельный запрос мог уже обновить jar — новый токен не нужно менять ещё раз.
    let refreshed = await getRemangaSessionToken(jar, ctx.domain);
    if (!refreshed || refreshed === token) {
      let pending = RELOGINS.get(jar);
      if (!pending) {
        const credentials = account.credentials;
        pending = (async () => {
          try {
            const next = await loginRemanga(ctx.http, ctx.domain, credentials);
            if (!next)
              throw new SourceTokenExpiredError('ReManga login rejected', SOURCE_ID.REMANGA);
            await saveRemangaSessionToken(jar, ctx.domain, next);
            account.onChange?.();
            return next;
          } finally {
            RELOGINS.delete(jar);
          }
        })();
        RELOGINS.set(jar, pending);
      }
      refreshed = await pending;
    }
    return fetchRemangaAccountJson<T>(ctx.http, ctx.domain, refreshed, path);
  }
};

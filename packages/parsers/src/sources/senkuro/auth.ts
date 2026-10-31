import { CookieJar } from 'tough-cookie';
import type { HttpClient } from '../../core/http/client';
import { classifyResponse } from '../../core/http/classify';
import { ParseError, SourceTokenExpiredError } from '../../errors';
import { SOURCE_ID, catalogEntryFor } from '../catalog';
import type { SenkuroConfig } from './config';
import type { SenkuroViewer } from './models';

/** Публичный клиент обоих сайтов: cookie access_token → Authorization: Bearer (2026-10-30). */
export const SENKURO_SESSION_COOKIE = 'access_token';
const TOKEN_REGEX = /^[\w.~+/-]{20,}=*$/;
// Один токен принимают оба API (проверено 2026-10-30). Jar — только шифруемое хранилище:
// читаем его по одному адресу независимо от домена текущего каталога или зеркала.
const SESSION_ORIGIN = `https://${catalogEntryFor(SOURCE_ID.SENKURO).domains[0]}/`;

const VIEWER_QUERY = `query ImportViewer {
  viewer {
    user { id name }
    userBookmarkCollections { id name entityType status system preference { name } }
  }
}`;

export const parseSenkuroSessionValue = (value: string): string | null => {
  const text = value.trim();
  const pair = text
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SENKURO_SESSION_COOKIE}=`));
  let token = pair ? pair.slice(SENKURO_SESSION_COOKIE.length + 1) : text;
  try {
    token = decodeURIComponent(token);
  } catch {
    return null;
  }
  return TOKEN_REGEX.test(token) ? token : null;
};

export const createSenkuroSessionJar = async (token: string) => {
  const jar = new CookieJar();
  await jar.setCookie(
    `${SENKURO_SESSION_COOKIE}=${token}; Path=/; Secure; HttpOnly`,
    SESSION_ORIGIN,
  );
  return jar;
};

export const getSenkuroSessionToken = async (jar: CookieJar) =>
  (await jar.getCookies(SESSION_ORIGIN)).find(({ key }) => key === SENKURO_SESSION_COOKIE)?.value ??
  null;

export const fetchSenkuroAccountData = async <T>(
  http: HttpClient,
  cfg: SenkuroConfig,
  domain: string,
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const res = await http.request({
    method: 'POST',
    url: cfg.apiEndpoint,
    headers: {
      'Content-Type': 'application/json',
      'app-id': cfg.appId,
      Authorization: `Bearer ${token}`,
      Origin: `https://${domain}`,
      Referer: `https://${domain}/`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new SourceTokenExpiredError('Senkuro session expired', cfg.id);
  const error = classifyResponse(cfg.id, res.status, res.url, res.headers, res.text());
  if (error) throw error;
  const json = res.json<{ data?: T; errors?: { extensions?: { code?: string } }[] }>();
  if (
    json.errors?.some(
      ({ extensions }) =>
        extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'NOT_AUTHORIZED',
    )
  )
    throw new SourceTokenExpiredError('Senkuro session expired', cfg.id);
  // Не пишем ответ целиком в ошибку: он может содержать данные личного аккаунта.
  if (json.errors?.length || !json.data)
    throw new ParseError('Senkuro account query failed', cfg.id);
  return json.data;
};

export const fetchSenkuroViewer = async (
  http: HttpClient,
  cfg: SenkuroConfig,
  domain: string,
  token: string,
): Promise<SenkuroViewer> => {
  const { viewer } = await fetchSenkuroAccountData<{ viewer: SenkuroViewer }>(
    http,
    cfg,
    domain,
    token,
    VIEWER_QUERY,
  );
  if (!viewer || !('user' in viewer)) throw new ParseError('Senkuro viewer is missing', cfg.id);
  if (viewer.user === null) throw new SourceTokenExpiredError('Senkuro session expired', cfg.id);
  if (
    !viewer.user.id ||
    typeof viewer.user.name !== 'string' ||
    !Array.isArray(viewer.userBookmarkCollections)
  )
    throw new ParseError('Senkuro viewer is malformed', cfg.id);
  return viewer;
};

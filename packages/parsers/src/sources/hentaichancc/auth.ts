import { CookieJar } from 'tough-cookie';
import type { HttpClient, HttpResponse } from '../../core/http/client';
import { classifyResponse, looksLikeAntibotChallenge } from '../../core/http/classify';
import { ParseError, SourceTokenExpiredError } from '../../errors';
import { SOURCE_ID } from '../catalog';
import { HENTAICHAN_CC_SESSION_COOKIE, type HentaichanViewer } from './models';

const SESSION_VALUE_REGEX = /^[\w.%~+/=-]+$/;
const UUID_REGEX = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** Keep the signed (possibly percent-encoded) value exactly as copied from DevTools. */
export const parseHentaichanCcSessionValue = (value: string): string | null => {
  const text = value.trim();
  const pair = text
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${HENTAICHAN_CC_SESSION_COOKIE}=`));
  const session = pair ? pair.slice(HENTAICHAN_CC_SESSION_COOKIE.length + 1) : text;
  return SESSION_VALUE_REGEX.test(session) ? session : null;
};

export const createHentaichanCcSessionJar = async (domain: string, session: string) => {
  const jar = new CookieJar();
  await jar.setCookie(
    `${HENTAICHAN_CC_SESSION_COOKIE}=${session}; Path=/; Secure; HttpOnly; SameSite=Lax`,
    `https://${domain}/`,
  );
  return jar;
};

export const checkHentaichanCcResponse = (res: HttpResponse) => {
  if (
    (res.status === 401 || res.status === 403) &&
    !looksLikeAntibotChallenge(res.status, res.headers, res.text())
  )
    throw new SourceTokenExpiredError('HentaiChan session expired', SOURCE_ID.HENTAICHAN_CC);
  const error = classifyResponse(
    SOURCE_ID.HENTAICHAN_CC,
    res.status,
    res.url,
    res.headers,
    res.text(),
  );
  if (error) throw error;
};

/** Better Auth session; directusId is the id used by the site's profile actions. */
export const fetchHentaichanCcViewer = async (
  http: HttpClient,
  domain: string,
): Promise<HentaichanViewer> => {
  const res = await http.request({
    url: `https://${domain}/api/auth/get-session?disableCookieCache=true`,
  });
  checkHentaichanCcResponse(res);
  const data = res.json<{
    user?: { id?: string; directusId?: string; name?: string };
    session?: { expiresAt?: string };
  } | null>();
  if (data === null)
    throw new SourceTokenExpiredError('HentaiChan session expired', SOURCE_ID.HENTAICHAN_CC);
  const id = data.user?.directusId ?? data.user?.id;
  if (
    !id ||
    !UUID_REGEX.test(id) ||
    typeof data.user?.name !== 'string' ||
    !data.user.name ||
    !data.session?.expiresAt ||
    !Number.isFinite(Date.parse(data.session.expiresAt))
  )
    throw new ParseError('HentaiChan session response is malformed', SOURCE_ID.HENTAICHAN_CC);
  if (Date.parse(data.session.expiresAt) <= Date.now())
    throw new SourceTokenExpiredError('HentaiChan session expired', SOURCE_ID.HENTAICHAN_CC);
  return { id, name: data.user.name };
};

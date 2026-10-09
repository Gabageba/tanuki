import iconv from 'iconv-lite';
import type { CookieJar } from 'tough-cookie';
import type { GroupleCredentials, Logger } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';

/** PHP-Fusion's login cookie — set only for accepted credentials (verified live 2026-10-10: a
 *  wrong password leaves just `fusion_visited`), valid for 180 days with `remember_me`. */
const SESSION_COOKIE = 'fusion_user';

/** Characters `encodeURIComponent` leaves as-is; every other byte gets percent-encoded. */
const UNRESERVED_RE = /[A-Za-z0-9\-_.!~*'()]/;

/**
 * Percent-encodes a value in windows-1251 — the site's own charset. Its `/search` reads
 * `stext` as cp1251 bytes (verified live: «девушка» as cp1251 finds 28 titles, the same word as
 * UTF-8 bounces to an external search page), and its login form posts the same way.
 */
export const encodeCp1251 = (value: string) =>
  Array.from(iconv.encode(value, 'win1251'))
    .map((byte) => {
      const char = String.fromCharCode(byte);
      return byte < 0x80 && UNRESERVED_RE.test(char)
        ? char
        : `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    })
    .join('');

export const hasNudeMoonSession = async (jar: CookieJar, domain: string) =>
  (await jar.getCookies(`https://${domain}/`)).some((cookie) => cookie.key === SESSION_COOKIE);

/**
 * Posts the site's own `loginform` (`/setuser.php`) and reports whether it set the session
 * cookie. The response is a 200 with a JS redirect either way, so the cookie is the only signal.
 * An account's jar is created empty, yet `ctx.http` sends every request of that viewer through
 * it — so the jar also gets `NMfYa`, the cookie the parser puts into each of its own jars.
 */
export const loginNudeMoon = async (
  http: HttpClient,
  jar: CookieJar,
  domain: string,
  credentials: GroupleCredentials,
  logger: Logger,
): Promise<boolean> => {
  const body = [
    ['user_name', credentials.username],
    ['user_pass', credentials.password],
    ['remember_me', 'y'],
    ['login', 'Войти'],
  ]
    .map(([key, value]) => `${key}=${encodeCp1251(value ?? '')}`)
    .join('&');

  await jar.setCookie(`NMfYa=1; Domain=${domain}; Path=/`, `https://${domain}/`);
  try {
    await http.request({
      method: 'POST',
      url: `https://${domain}/setuser.php`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Origin: `https://${domain}`,
        Referer: `https://${domain}/`,
      },
      body,
    });
  } catch (err) {
    logger.warn(`Nude-Moon login failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }

  const isLoggedIn = await hasNudeMoonSession(jar, domain);
  if (!isLoggedIn) {
    logger.warn('Nude-Moon login did not yield a session cookie — credentials likely rejected');
  }
  return isLoggedIn;
};

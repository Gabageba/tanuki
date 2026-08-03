import type { CookieJar } from 'tough-cookie';
import type { GroupleCredentials, Logger } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';
import { GROUPLE_CONFIGS, MAIN_AUTH_GATEWAY } from './config';

const FAN_OUT_DOMAINS = [
  MAIN_AUTH_GATEWAY,
  ...GROUPLE_CONFIGS.filter((c) => c.authGateway === MAIN_AUTH_GATEWAY).flatMap((c) => c.domains),
];

// All 6 Grouple sources share one jar (see registry.ts cookieScope='grouple') and each calls
// init() -> authenticateGrouple independently. Memoized by jar so the actual network login
// happens exactly once per process, matching Application.kt's single startup login — the
// other 5 callers just await the same promise.
const loginPromises = new WeakMap<CookieJar, Promise<void>>();

/**
 * Logs in through the Grouple network's SSO gateway and fans the resulting `gwt` JWT cookie
 * out across every domain in the network. The cookie is self-contained (a signed JWT with the
 * account id/username) and not tied to any one site, but each GroupleParser checks for it on
 * its own domain, and tough-cookie matches by registrable domain — a.zazaza.me, mintmanga.one,
 * selfmanga.live etc. are all different registrable domains, so no Domain attribute can cover
 * them. Derived from GROUPLE_CONFIGS rather than hardcoded, so a new network member can't be
 * added without also getting the cookie fan-out.
 *
 * AllHentai's separate qawa.org gateway is intentionally excluded — this credential pair only
 * covers the main network.
 */
export function authenticateGrouple(
  http: HttpClient,
  jar: CookieJar,
  credentials: GroupleCredentials | undefined,
  logger: Logger,
): Promise<void> {
  if (!credentials) return Promise.resolve();
  const cached = loginPromises.get(jar);
  if (cached) return cached;
  const promise = doLogin(http, jar, credentials, logger);
  loginPromises.set(jar, promise);
  return promise;
}

async function doLogin(
  http: HttpClient,
  jar: CookieJar,
  credentials: GroupleCredentials,
  logger: Logger,
): Promise<void> {
  const siteId = 2;
  const loginUrl = `https://${MAIN_AUTH_GATEWAY}/login/authenticate?ttt=${Date.now()}&siteId=${siteId}`;

  try {
    const res = await http.request({
      method: 'POST',
      url: loginUrl,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Origin: `https://${MAIN_AUTH_GATEWAY}`,
        Referer: `https://${MAIN_AUTH_GATEWAY}/internal/auth/login?siteId=${siteId}`,
      },
      body: new URLSearchParams({
        targetUri: `/login/continueSso?siteId=${siteId}&targetUri=%2F`,
        username: credentials.username,
        password: credentials.password,
        remember_me: 'true',
        _remember_me_yes: '',
        remember_me_yes: 'on',
      }),
    });
    if (res.status >= 400) {
      logger.warn(`Grouple login request failed: HTTP ${res.status}`);
    }
  } catch (err) {
    logger.warn(
      `Grouple login request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const cookies = await jar.getCookies(`https://${MAIN_AUTH_GATEWAY}/`);
  const gwt = cookies.find((c) => c.key === 'gwt');
  if (!gwt) {
    logger.warn("Grouple login did not yield a 'gwt' cookie — credentials likely rejected");
    return;
  }

  for (const domain of FAN_OUT_DOMAINS) {
    await jar.setCookie(`gwt=${gwt.value}; Path=/; Secure`, `https://${domain}/`);
  }
  logger.info(`Grouple SSO session established for ${FAN_OUT_DOMAINS.length} domains`);
}

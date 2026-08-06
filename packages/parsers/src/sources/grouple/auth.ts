import type { CookieJar } from 'tough-cookie';
import type { GroupleCredentials, Logger } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';
import { catalogEntryFor } from '../catalog';
import type { GroupleConfig } from './config';
import { GROUPLE_CONFIGS, MAIN_AUTH_GATEWAY } from './config';

const FAN_OUT_DOMAINS = [
  MAIN_AUTH_GATEWAY,
  ...GROUPLE_CONFIGS.filter((c) => c.authGateway === MAIN_AUTH_GATEWAY).flatMap(
    (c) => catalogEntryFor(c.id).domains,
  ),
];

// All Grouple sources on the main gateway share one jar (see registry.ts cookieScope='grouple')
// and each calls init() -> authenticateGrouple independently. Memoized by jar so the actual
// network login happens exactly once per process, matching Application.kt's single startup
// login — the other callers just await the same promise.
const loginPromises = new WeakMap<CookieJar, Promise<void>>();

// AllHentai shares the same jar but logs in through its own qawa.org gateway (see
// authenticateAllHentai below), so it gets its own memoization keyed off the same jar.
const qawaLoginPromises = new WeakMap<CookieJar, Promise<void>>();

type GatewayLoginParams = {
  gateway: string;
  siteId: number;
  fanOutDomains: readonly string[];
  /** Cookie names that count as proof of auth, checked in order; the first match is fanned out. */
  authCookieNames: readonly string[];
  label: string;
};

/**
 * Posts credentials to a Grouple-family SSO gateway's login endpoint, then reads back
 * whichever auth cookie the gateway set and fans it out (Domain attributes can't cover
 * multiple registrable domains, so each target domain needs its own copy). Shared by both
 * the main network login and AllHentai's separate qawa.org login below — same login form
 * shape, different gateway/siteId/domains.
 */
const performGatewayLogin = async (
  http: HttpClient,
  jar: CookieJar,
  params: GatewayLoginParams,
  credentials: GroupleCredentials,
  logger: Logger,
): Promise<void> => {
  const { gateway, siteId, fanOutDomains, authCookieNames, label } = params;
  const loginUrl = `https://${gateway}/login/authenticate?ttt=${Date.now()}&siteId=${siteId}`;

  try {
    const res = await http.request({
      method: 'POST',
      url: loginUrl,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Origin: `https://${gateway}`,
        Referer: `https://${gateway}/internal/auth/login?siteId=${siteId}`,
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
      logger.warn(`${label} login request failed: HTTP ${res.status}`);
    }
  } catch (err) {
    logger.warn(
      `${label} login request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const cookies = await jar.getCookies(`https://${gateway}/`);
  const authCookie = cookies.find((c) => authCookieNames.includes(c.key));
  if (!authCookie) {
    logger.warn(`${label} login did not yield an auth cookie — credentials likely rejected`);
    return;
  }

  for (const domain of fanOutDomains) {
    await jar.setCookie(
      `${authCookie.key}=${authCookie.value}; Path=/; Secure`,
      `https://${domain}/`,
    );
  }
  logger.info(`${label} SSO session established for ${fanOutDomains.length} domains`);
};

/**
 * Logs in through the main Grouple network's SSO gateway and fans the resulting `gwt` JWT
 * cookie out across every domain in the network. The cookie is self-contained (a signed JWT
 * with the account id/username) and not tied to any one site, but each GroupleParser checks
 * for it on its own domain, and tough-cookie matches by registrable domain — a.zazaza.me,
 * mintmanga.one, selfmanga.live etc. are all different registrable domains, so no Domain
 * attribute can cover them. Derived from GROUPLE_CONFIGS rather than hardcoded, so a new
 * network member can't be added without also getting the cookie fan-out.
 *
 * AllHentai is excluded from FAN_OUT_DOMAINS — it uses a separate qawa.org gateway, see
 * authenticateAllHentai below.
 */
export const authenticateGrouple = (
  http: HttpClient,
  jar: CookieJar,
  credentials: GroupleCredentials | undefined,
  logger: Logger,
): Promise<void> => {
  if (!credentials) return Promise.resolve();
  const cached = loginPromises.get(jar);
  if (cached) return cached;
  const promise = performGatewayLogin(
    http,
    jar,
    {
      gateway: MAIN_AUTH_GATEWAY,
      siteId: 2,
      fanOutDomains: FAN_OUT_DOMAINS,
      authCookieNames: ['gwt'],
      label: 'Grouple',
    },
    credentials,
    logger,
  );
  loginPromises.set(jar, promise);
  return promise;
};

/**
 * Logs in through AllHentai's own qawa.org SSO gateway. Separate from the main network login
 * above — it's a different gateway host with its own account system, so it needs its own
 * credentials (Credentials.allhentai, not Credentials.grouple). The gateway is also known to
 * hand back `remember_me` instead of `gwt` in some cases (see GroupleConfig.extraAuthCookies),
 * so both cookie names are accepted here.
 */
export const authenticateAllHentai = (
  http: HttpClient,
  jar: CookieJar,
  cfg: GroupleConfig,
  credentials: GroupleCredentials | undefined,
  logger: Logger,
): Promise<void> => {
  if (!credentials) return Promise.resolve();
  const cached = qawaLoginPromises.get(jar);
  if (cached) return cached;
  const promise = performGatewayLogin(
    http,
    jar,
    {
      gateway: cfg.authGateway,
      siteId: cfg.siteId,
      fanOutDomains: catalogEntryFor(cfg.id).domains,
      authCookieNames: ['gwt', ...(cfg.extraAuthCookies ?? [])],
      label: catalogEntryFor(cfg.id).title,
    },
    credentials,
    logger,
  );
  qawaLoginPromises.set(jar, promise);
  return promise;
};

import type { GroupleCredentials, Logger } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';
import { classifyResponse } from '../../core/http/classify';
import { SourceBlockedError, SourceUnavailableError } from '../../errors';
import { SOURCE_ID } from '../catalog';

/** Page config in every layout — `window.user_id = 0;` for a guest, the account's id once logged in. */
const USER_ID_REGEX = /window\.user_id\s*=\s*(\d+)/;

/** Laravel's CSRF token, the one the site's own AJAX sends as `X-CSRF-TOKEN`. */
const CSRF_TOKEN_REGEX = /<meta[^>]+name="csrf-token"[^>]+content="([^"]+)"/;

/** Laravel answers a rejected email/password with a 422 validation error. */
const HTTP_UNPROCESSABLE = 422;

/** The site's AJAX captcha (Turnstile) — `{ captcha_required: true }`, a human has to solve it. */
const HTTP_CAPTCHA_REQUIRED = 428;

/** The logged-in account's id on the page, null for a guest or a page without the config. */
export const parseMangaBuffUserId = (html: string): number | null => {
  const id = Number(USER_ID_REGEX.exec(html)?.[1] ?? 0);
  return id > 0 ? id : null;
};

/**
 * Posts the login the site's own `.login-button` sends (`POST /login`, `email` + `password`, the
 * CSRF token from the login page's meta) and returns the account id, null if the site didn't
 * accept the credentials. The answer is JSON either way and the site then just reloads `/`, so
 * the id in `/`'s page config is the signal. The login page is opened first: an account's jar
 * starts empty, and Laravel checks the token against the session cookie that page sets.
 */
export const loginMangaBuff = async (
  http: HttpClient,
  domain: string,
  credentials: GroupleCredentials,
  logger: Logger,
): Promise<number | null> => {
  try {
    // get classifies a 5xx or an antibot page as an error — not as a rejected password.
    const page = await http.get(`https://${domain}/login`);
    const token = CSRF_TOKEN_REGEX.exec(page.text())?.[1];
    if (!token) {
      logger.warn('MangaBuff login page has no CSRF token');
      return null;
    }
    const res = await http.request({
      method: 'POST',
      url: `https://${domain}/login`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': token,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/login`,
      },
      body: new URLSearchParams({ email: credentials.username, password: credentials.password }),
    });
    if (res.status === HTTP_UNPROCESSABLE) {
      logger.warn(`MangaBuff login rejected: ${res.text().slice(0, 200)}`);
      return null;
    }
    if (res.status === HTTP_CAPTCHA_REQUIRED) {
      throw new SourceBlockedError(
        `Captcha required at https://${domain}/login`,
        SOURCE_ID.MANGABUFF,
      );
    }
    const error = classifyResponse(
      SOURCE_ID.MANGABUFF,
      res.status,
      res.url,
      res.headers,
      res.text(),
    );
    if (error) throw error;

    const userId = parseMangaBuffUserId((await http.get(`https://${domain}/`)).text());
    if (userId === null) logger.warn('MangaBuff login did not yield a session');
    return userId;
  } catch (err) {
    // The site not answering is not a rejected password — let the caller tell them apart.
    if (err instanceof SourceUnavailableError || err instanceof SourceBlockedError) throw err;
    logger.warn(`MangaBuff login failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
};

import type { GroupleCredentials, Logger } from '../../core/parser';
import type { HttpClient } from '../../core/http/client';
import { SourceBlockedError, SourceUnavailableError } from '../../errors';

/** XenForo's page config — `visitor: { user_id: 0 }` for a guest, the account's id once logged in. */
const VISITOR_ID_REGEX = /visitor:\s*\{\s*user_id:\s*(\d+)/;

/** XenForo's error box on the login page — "user not found", "wrong password", "cookies off". */
const ERROR_PANEL_REGEX = /<div class="errorPanel">([\s\S]*?)<\/div>/;

/** The logged-in account's id on the page, null for a guest or a page without the config. */
export const parseDesuVisitorId = (html: string): number | null => {
  const id = Number(VISITOR_ID_REGEX.exec(html)?.[1] ?? 0);
  return id > 0 ? id : null;
};

/**
 * Posts XenForo's own login form (`/login/login`) and returns the account id, null if the site
 * didn't accept the credentials. A wrong password comes back as a 200 login page with an
 * `errorPanel` and a guest `user_id: 0`; an accepted one redirects to `redirect`, whose page
 * already names the account (verified live 2026-10-26) — so the visitor id is the only signal.
 * `_xfToken` stays empty: XenForo checks CSRF only for logged-in visitors. With `cookie_check`
 * a request carrying no cookies at all is turned away before the password is even checked
 * ("в Вашем браузере должны быть включены cookie") — an account's jar starts empty, so the login
 * page is opened first for the antibot and session cookies.
 */
export const loginDesu = async (
  http: HttpClient,
  domain: string,
  credentials: GroupleCredentials,
  logger: Logger,
): Promise<number | null> => {
  try {
    // get/postForm classify a 5xx or an antibot page as an error — not as a rejected password.
    await http.get(`https://${domain}/login/`);
    const res = await http.postForm(
      `https://${domain}/login/login`,
      {
        login: credentials.username,
        password: credentials.password,
        remember: '1',
        cookie_check: '1',
        _xfToken: '',
        redirect: `https://${domain}/`,
      },
      { Origin: `https://${domain}`, Referer: `https://${domain}/login/` },
    );
    const html = res.text();
    const userId = parseDesuVisitorId(html);
    if (userId === null) {
      const error = ERROR_PANEL_REGEX.exec(html)?.[1]
        ?.replace(/<[^>]+>|\s+/g, ' ')
        .trim();
      logger.warn(`Desu login did not yield a session: ${error ?? 'no error shown'}`);
    }
    return userId;
  } catch (err) {
    // The site not answering is not a rejected password — let the caller tell them apart.
    if (err instanceof SourceUnavailableError || err instanceof SourceBlockedError) throw err;
    logger.warn(`Desu login failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
};

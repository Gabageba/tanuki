import { CookieJar } from 'tough-cookie';
import type { HttpClient } from '../../core/http/client';
import { UserAgents } from '../../core/http/user-agents';

/** Cookie сессии сайта — host-only на inkstory.net, живёт больше года (проверено 2026-10-27). */
export const INKSTORY_SESSION_COOKIE = '__otaku_session';

/** Значение cookie: без пробелов, `;` и кавычек — то, что DevTools показывает в колонке Value. */
const SESSION_VALUE_REGEX = /^[\w.~+/=-]+$/;

/**
 * Состояние роутера в SSR-разметке: `currentUser:null` у гостя, у вошедшего — объект с id и
 * именем первыми полями (сериализатор seroval, `$R[n]=` перед объектом). Проверено 2026-10-27.
 */
const CURRENT_USER_REGEX = /currentUser:\$R\[\d+\]=\{id:"([0-9a-f-]{36})",username:"([^"]*)"/;

/** Страница, на которой сайт называет вошедшего, — самая лёгкая из тех, что рендерит SSR. */
const VIEWER_PAGE_PATH = '/faq';

export type InkStoryViewer = {
  id: string;
  username: string;
};

/**
 * Разбирает то, что человек скопировал из DevTools: само значение cookie, пару
 * `__otaku_session=…` или целую строку заголовка Cookie. null — сессии в тексте нет.
 */
export const parseInkStorySessionValue = (value: string): string | null => {
  const text = value.trim();
  const pair = text
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${INKSTORY_SESSION_COOKIE}=`));
  const session = pair ? pair.slice(INKSTORY_SESSION_COOKIE.length + 1) : text;
  return SESSION_VALUE_REGEX.test(session) ? session : null;
};

/** Свежий jar с одной cookie сессии — его и хранит аккаунт пользователя. */
export const createInkStorySessionJar = async (domain: string, session: string) => {
  const jar = new CookieJar();
  await jar.setCookie(
    `${INKSTORY_SESSION_COOKIE}=${session}; Path=/; Secure; HttpOnly; SameSite=Lax`,
    `https://${domain}/`,
  );
  return jar;
};

/** Кто вошёл по разметке страницы; null — гость. */
export const parseInkStoryViewer = (html: string): InkStoryViewer | null => {
  const match = CURRENT_USER_REGEX.exec(html);
  return match ? { id: match[1]!, username: match[2]! } : null;
};

/**
 * Аккаунт, от которого идут запросы: http сам кладёт cookie сессии из jar. Сайт за ddos-guard,
 * поэтому, как и ключ расшифровки, страница запрашивается с браузерным User-Agent.
 */
export const fetchInkStoryViewer = async (
  http: HttpClient,
  domain: string,
): Promise<InkStoryViewer | null> => {
  const res = await http.get(`https://${domain}${VIEWER_PAGE_PATH}`, {
    'User-Agent': UserAgents.CHROME_DESKTOP,
  });
  return parseInkStoryViewer(res.text());
};
